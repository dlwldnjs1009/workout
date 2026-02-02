/**
 * Analysis Worker: 포즈 분석 후처리를 메인 스레드에서 분리
 * 
 * 메인 스레드에서 MediaPipe detectForVideo()를 실행한 후,
 * landmarks만 이 Worker로 전송하여 무거운 계산을 오프로드
 * 
 * 처리 내용:
 * - 스무딩 (EMA/칼만 필터 대신 단순 이동평균)
 * - 각도 계산
 * - 상태 머신 전환
 * - 규칙 기반 점수/피드백
 */

// ===== 타입 정의 (메인 스레드와 동일) =====

interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
  presence?: number;
}

type SquatPhase = 'STANDING' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING';
type CameraMode = 'FRONT' | 'SIDE';
type LandmarkConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

interface SquatCalibration {
  standingAngle: number;
  bottomAngle: number;
  isCalibrated: boolean;
}

// Worker 입력 메시지
interface AnalysisInput {
  type: 'ANALYZE';
  landmarks: PoseLandmark[];
  timestamp: number;
  cameraMode: CameraMode;
  calibration: SquatCalibration | null;
}

interface ResetInput {
  type: 'RESET';
}

type WorkerInput = AnalysisInput | ResetInput;

// Worker 출력 메시지
interface AnalysisOutput {
  type: 'RESULT';
  phase: SquatPhase;
  kneeAngle: number;
  formScore: number;
  feedback: string[];
  repCompleted: boolean;
  confidence: LandmarkConfidence;
  calibrationSample?: {
    phase: SquatPhase;
    angle: number;
  };
}

interface ErrorOutput {
  type: 'ERROR';
  message: string;
}

// ===== 랜드마크 인덱스 =====

const POSE_LANDMARKS = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

// ===== 상태 =====

let lastPhase: SquatPhase = 'STANDING';
let lastKneeAngle = 180;
let lastRepTime = 0;
const angleHistory: number[] = [];
const SMOOTHING_WINDOW = 3;
const HYSTERESIS = 5;
const MIN_REP_DURATION = 800;

const DEFAULT_THRESHOLDS = {
  STANDING: 160,
  DESCENDING: 140,
  BOTTOM: 120,
};

// ===== 유틸리티 함수 =====

function calculateAngle(p1: PoseLandmark, p2: PoseLandmark, p3: PoseLandmark): number {
  const radians =
    Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs(radians * (180 / Math.PI));
  if (angle > 180) {
    angle = 360 - angle;
  }
  return angle;
}

function smoothAngle(newAngle: number): number {
  angleHistory.push(newAngle);
  if (angleHistory.length > SMOOTHING_WINDOW) {
    angleHistory.shift();
  }
  return angleHistory.reduce((a, b) => a + b, 0) / angleHistory.length;
}

function checkLandmarkValidity(landmarks: PoseLandmark[]): {
  isValid: boolean;
  confidence: LandmarkConfidence;
  message?: string;
} {
  const keyIndices = [
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.LEFT_KNEE,
    POSE_LANDMARKS.RIGHT_KNEE,
    POSE_LANDMARKS.LEFT_ANKLE,
    POSE_LANDMARKS.RIGHT_ANKLE,
  ];

  for (const idx of keyIndices) {
    const lm = landmarks[idx];
    if (!lm || (lm.presence ?? 1) < 0.5) {
      return {
        isValid: false,
        confidence: 'LOW',
        message: '전신이 화면에 나오도록 위치를 조정해주세요',
      };
    }
  }

  const avgVisibility =
    keyIndices.reduce((sum, idx) => sum + landmarks[idx].visibility, 0) /
    keyIndices.length;

  if (avgVisibility < 0.5) {
    return { isValid: true, confidence: 'LOW', message: '일부 관절이 가려져 있습니다' };
  }
  if (avgVisibility < 0.75) {
    return { isValid: true, confidence: 'MEDIUM' };
  }
  return { isValid: true, confidence: 'HIGH' };
}

function calculateKneeAngle(landmarks: PoseLandmark[]): number {
  const leftAngle = calculateAngle(
    landmarks[POSE_LANDMARKS.LEFT_HIP],
    landmarks[POSE_LANDMARKS.LEFT_KNEE],
    landmarks[POSE_LANDMARKS.LEFT_ANKLE]
  );
  const rightAngle = calculateAngle(
    landmarks[POSE_LANDMARKS.RIGHT_HIP],
    landmarks[POSE_LANDMARKS.RIGHT_KNEE],
    landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
  );

  const leftVis = landmarks[POSE_LANDMARKS.LEFT_KNEE].visibility;
  const rightVis = landmarks[POSE_LANDMARKS.RIGHT_KNEE].visibility;

  if (leftVis > 0.7 && rightVis > 0.7) {
    return (leftAngle + rightAngle) / 2;
  }
  return leftVis > rightVis ? leftAngle : rightAngle;
}

function getThresholds(cal: SquatCalibration | null) {
  if (!cal?.isCalibrated) return DEFAULT_THRESHOLDS;

  const range = cal.standingAngle - cal.bottomAngle;
  return {
    STANDING: cal.standingAngle - range * 0.15,
    DESCENDING: cal.standingAngle - range * 0.3,
    BOTTOM: cal.bottomAngle + range * 0.2,
  };
}

function determinePhase(
  kneeAngle: number,
  prevPhase: SquatPhase,
  thresholds: typeof DEFAULT_THRESHOLDS
): SquatPhase {
  const isDescending = kneeAngle < lastKneeAngle - 2;
  const isAscending = kneeAngle > lastKneeAngle + 2;

  switch (prevPhase) {
    case 'STANDING':
      if (kneeAngle < thresholds.DESCENDING - HYSTERESIS) {
        return 'DESCENDING';
      }
      break;
    case 'DESCENDING':
      if (kneeAngle < thresholds.BOTTOM + HYSTERESIS) {
        return 'BOTTOM';
      }
      if (kneeAngle > thresholds.STANDING - HYSTERESIS && isAscending) {
        return 'STANDING';
      }
      break;
    case 'BOTTOM':
      if (isAscending && kneeAngle > thresholds.BOTTOM + HYSTERESIS + 10) {
        return 'ASCENDING';
      }
      break;
    case 'ASCENDING':
      if (kneeAngle > thresholds.STANDING - HYSTERESIS) {
        return 'STANDING';
      }
      if (isDescending && kneeAngle < thresholds.DESCENDING) {
        return 'DESCENDING';
      }
      break;
  }

  return prevPhase;
}

function calculateFormScore(
  landmarks: PoseLandmark[],
  mode: CameraMode,
  confidence: LandmarkConfidence,
  kneeAngle: number
): { score: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 100;

  const deductionMultiplier =
    confidence === 'HIGH' ? 1 : confidence === 'MEDIUM' ? 0.7 : 0.5;

  // ROM
  if (kneeAngle > 120) {
    score -= 15 * deductionMultiplier;
    feedback.push('더 깊이 앉아보세요');
  }

  // 좌우 비대칭
  const leftKneeY = landmarks[POSE_LANDMARKS.LEFT_KNEE].y;
  const rightKneeY = landmarks[POSE_LANDMARKS.RIGHT_KNEE].y;
  if (Math.abs(leftKneeY - rightKneeY) > 0.05) {
    score -= 10 * deductionMultiplier;
    feedback.push('양쪽 무릎 높이를 맞춰주세요');
  }

  // 무릎 Valgus (정면)
  if (mode === 'FRONT') {
    const leftKneeX = landmarks[POSE_LANDMARKS.LEFT_KNEE].x;
    const leftAnkleX = landmarks[POSE_LANDMARKS.LEFT_ANKLE].x;
    const rightKneeX = landmarks[POSE_LANDMARKS.RIGHT_KNEE].x;
    const rightAnkleX = landmarks[POSE_LANDMARKS.RIGHT_ANKLE].x;

    if (leftKneeX > leftAnkleX + 0.03 || rightKneeX < rightAnkleX - 0.03) {
      score -= 15 * deductionMultiplier;
      feedback.push('무릎이 안쪽으로 모이고 있어요');
    }
  }

  // 측면 규칙
  if (mode === 'SIDE') {
    const kneeX = landmarks[POSE_LANDMARKS.LEFT_KNEE].x;
    const ankleX = landmarks[POSE_LANDMARKS.LEFT_ANKLE].x;
    if (kneeX < ankleX - 0.08) {
      score -= 15 * deductionMultiplier;
      feedback.push('무릎이 발끝보다 앞으로 나갔어요');
    }

    const shoulderY = landmarks[POSE_LANDMARKS.LEFT_SHOULDER].y;
    const hipY = landmarks[POSE_LANDMARKS.LEFT_HIP].y;
    const shoulderX = landmarks[POSE_LANDMARKS.LEFT_SHOULDER].x;
    const hipX = landmarks[POSE_LANDMARKS.LEFT_HIP].x;
    const torsoAngle = Math.atan2(hipY - shoulderY, hipX - shoulderX) * (180 / Math.PI);

    if (Math.abs(torsoAngle - 90) > 30) {
      score -= 10 * deductionMultiplier;
      feedback.push('상체를 조금 더 세워주세요');
    }
  }

  // 깊이 보너스
  if (kneeAngle < 90) {
    score += 5;
    if (feedback.length === 0) {
      feedback.push('좋은 깊이입니다!');
    }
  }

  return { score: Math.max(0, Math.min(100, score)), feedback };
}

// ===== 메시지 핸들러 =====

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const data = e.data;

  if (data.type === 'RESET') {
    lastPhase = 'STANDING';
    lastKneeAngle = 180;
    lastRepTime = 0;
    angleHistory.length = 0;
    return;
  }

  if (data.type === 'ANALYZE') {
    try {
      const { landmarks, timestamp, cameraMode, calibration } = data;

      // 1. 유효성 검사
      const validity = checkLandmarkValidity(landmarks);
      if (!validity.isValid) {
        const output: AnalysisOutput = {
          type: 'RESULT',
          phase: lastPhase,
          kneeAngle: lastKneeAngle,
          formScore: 0,
          feedback: validity.message ? [validity.message] : [],
          repCompleted: false,
          confidence: validity.confidence,
        };
        self.postMessage(output);
        return;
      }

      // 2. 각도 계산 + 스무딩
      const rawKneeAngle = calculateKneeAngle(landmarks);
      const kneeAngle = smoothAngle(rawKneeAngle);

      // 3. 임계값 결정
      const thresholds = getThresholds(calibration);

      // 4. phase 결정
      const newPhase = determinePhase(kneeAngle, lastPhase, thresholds);

      // 5. 반복 완료 감지
      let repCompleted = false;
      let formScore = 0;
      let feedback: string[] = [];

      if (
        lastPhase === 'ASCENDING' &&
        newPhase === 'STANDING' &&
        timestamp - lastRepTime > MIN_REP_DURATION
      ) {
        repCompleted = true;
        const result = calculateFormScore(landmarks, cameraMode, validity.confidence, kneeAngle);
        formScore = result.score;
        feedback = result.feedback;
        lastRepTime = timestamp;
      } else if (newPhase === 'BOTTOM') {
        const result = calculateFormScore(landmarks, cameraMode, validity.confidence, kneeAngle);
        feedback = result.feedback;
      }

      // 6. 캘리브레이션 샘플
      let calibrationSample: { phase: SquatPhase; angle: number } | undefined;
      if (!calibration?.isCalibrated) {
        if (newPhase === 'STANDING' && kneeAngle > 150) {
          calibrationSample = { phase: 'STANDING', angle: kneeAngle };
        } else if (newPhase === 'BOTTOM' && kneeAngle < 120) {
          calibrationSample = { phase: 'BOTTOM', angle: kneeAngle };
        }
      }

      // 7. 상태 업데이트
      lastPhase = newPhase;
      lastKneeAngle = kneeAngle;

      // 8. 결과 전송
      const output: AnalysisOutput = {
        type: 'RESULT',
        phase: newPhase,
        kneeAngle,
        formScore,
        feedback,
        repCompleted,
        confidence: validity.confidence,
        calibrationSample,
      };
      self.postMessage(output);
    } catch (error) {
      const output: ErrorOutput = {
        type: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
      self.postMessage(output);
    }
  }
};

// TypeScript export for module type
export {};
