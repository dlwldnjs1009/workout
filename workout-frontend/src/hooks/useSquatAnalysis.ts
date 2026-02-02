import { useCallback, useRef } from 'react';
import { usePoseStore } from '../store/poseStore';
import type {
  PoseLandmark,
  SquatPhase,
  CameraMode,
  LandmarkConfidence,
  SquatCalibration,
} from '../types';
import { POSE_LANDMARKS } from '../types';

// ===== 기본 임계값 (캘리브레이션 전) =====
const DEFAULT_THRESHOLDS = {
  STANDING: 160,
  DESCENDING: 140,
  BOTTOM: 120,
};

// 상태 전환 히스테리시스 (노이즈 방지)
const HYSTERESIS = 5;

// 최소 반복 시간 (ms) - 너무 빠른 반복 방지
const MIN_REP_DURATION = 800;

interface UseSquatAnalysisReturn {
  analyze: (landmarks: PoseLandmark[]) => void;
  resetAnalysis: () => void;
}

/**
 * useSquatAnalysis: 스쿼트 자세 분석 로직을 담당하는 훅
 * 
 * - visibility/presence 기반 랜드마크 유효성 검사
 * - 캘리브레이션 시스템 (세션 초기 3~5회)
 * - 상태 머신 기반 스쿼트 phase 추적
 * - 카메라 모드별 규칙 기반 폼 점수 계산
 */
export function useSquatAnalysis(): UseSquatAnalysisReturn {
  const {
    cameraMode,
    calibration,
    updateAnalysisState,
    incrementRep,
    setFeedback,
    setCalibration,
  } = usePoseStore();

  // 캘리브레이션 샘플 수집
  const calibrationSamples = useRef<{ standing: number[]; bottom: number[] }>({
    standing: [],
    bottom: [],
  });

  // 상태 머신 추적
  const lastPhaseRef = useRef<SquatPhase>('STANDING');
  const lastRepTimeRef = useRef<number>(0);
  const lastKneeAngleRef = useRef<number>(180);

  // 스무딩을 위한 이전 값 저장
  const angleHistoryRef = useRef<number[]>([]);
  const SMOOTHING_WINDOW = 3;

  /**
   * 랜드마크 유효성 검사
   */
  const checkLandmarkValidity = useCallback(
    (landmarks: PoseLandmark[]): {
      isValid: boolean;
      confidence: LandmarkConfidence;
      message?: string;
    } => {
      const keyIndices = [
        POSE_LANDMARKS.LEFT_HIP,
        POSE_LANDMARKS.RIGHT_HIP,
        POSE_LANDMARKS.LEFT_KNEE,
        POSE_LANDMARKS.RIGHT_KNEE,
        POSE_LANDMARKS.LEFT_ANKLE,
        POSE_LANDMARKS.RIGHT_ANKLE,
      ];

      // presence 체크: 랜드마크가 존재하는지
      for (const idx of keyIndices) {
        const lm = landmarks[idx];
        if (!lm) {
          return {
            isValid: false,
            confidence: 'LOW',
            message: '전신이 화면에 나오도록 위치를 조정해주세요',
          };
        }

        // presence < 0.5면 랜드마크가 감지되지 않음
        if ((lm.presence ?? 1) < 0.5) {
          return {
            isValid: false,
            confidence: 'LOW',
            message: '전신이 화면에 나오도록 위치를 조정해주세요',
          };
        }
      }

      // visibility 체크: 가려진 정도
      const avgVisibility =
        keyIndices.reduce((sum, idx) => sum + landmarks[idx].visibility, 0) /
        keyIndices.length;

      if (avgVisibility < 0.5) {
        return {
          isValid: true,
          confidence: 'LOW',
          message: '일부 관절이 가려져 있습니다',
        };
      }

      if (avgVisibility < 0.75) {
        return { isValid: true, confidence: 'MEDIUM' };
      }

      return { isValid: true, confidence: 'HIGH' };
    },
    []
  );

  /**
   * 무릎 각도 계산 (두 다리 평균)
   */
  const calculateKneeAngle = useCallback((landmarks: PoseLandmark[]): number => {
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

    // 두 다리 평균 (한쪽이 가려지면 다른 쪽 사용)
    const leftVis = landmarks[POSE_LANDMARKS.LEFT_KNEE].visibility;
    const rightVis = landmarks[POSE_LANDMARKS.RIGHT_KNEE].visibility;

    if (leftVis > 0.7 && rightVis > 0.7) {
      return (leftAngle + rightAngle) / 2;
    } else if (leftVis > rightVis) {
      return leftAngle;
    } else {
      return rightAngle;
    }
  }, []);

  /**
   * 스무딩 적용 (노이즈 감소)
   */
  const smoothAngle = useCallback((newAngle: number): number => {
    angleHistoryRef.current.push(newAngle);
    if (angleHistoryRef.current.length > SMOOTHING_WINDOW) {
      angleHistoryRef.current.shift();
    }

    const sum = angleHistoryRef.current.reduce((a, b) => a + b, 0);
    return sum / angleHistoryRef.current.length;
  }, []);

  /**
   * 캘리브레이션 후 동적 임계값 계산
   */
  const getThresholds = useCallback((cal: SquatCalibration) => {
    if (!cal.isCalibrated) return DEFAULT_THRESHOLDS;

    const range = cal.standingAngle - cal.bottomAngle;
    return {
      STANDING: cal.standingAngle - range * 0.15,
      DESCENDING: cal.standingAngle - range * 0.3,
      BOTTOM: cal.bottomAngle + range * 0.2,
    };
  }, []);

  /**
   * 스쿼트 phase 결정
   */
  const determinePhase = useCallback(
    (kneeAngle: number, prevPhase: SquatPhase, thresholds: typeof DEFAULT_THRESHOLDS): SquatPhase => {
      const prevAngle = lastKneeAngleRef.current;
      const isDescending = kneeAngle < prevAngle - 2;
      const isAscending = kneeAngle > prevAngle + 2;

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
    },
    []
  );

  /**
   * 폼 점수 계산 (카메라 모드별 규칙)
   */
  const calculateFormScore = useCallback(
    (
      landmarks: PoseLandmark[],
      mode: CameraMode,
      confidence: LandmarkConfidence,
      kneeAngle: number
    ): { score: number; feedback: string[] } => {
      const feedback: string[] = [];
      let score = 100;

      // confidence 낮으면 감점 줄임
      const deductionMultiplier =
        confidence === 'HIGH' ? 1 : confidence === 'MEDIUM' ? 0.7 : 0.5;

      // ===== 공통 규칙 =====

      // 1. ROM (깊이) - 가장 신뢰할 수 있는 지표
      if (kneeAngle > 120) {
        score -= 15 * deductionMultiplier;
        feedback.push('더 깊이 앉아보세요');
      }

      // 2. 좌우 비대칭 (정면에서 특히 유효)
      const leftKneeY = landmarks[POSE_LANDMARKS.LEFT_KNEE].y;
      const rightKneeY = landmarks[POSE_LANDMARKS.RIGHT_KNEE].y;
      if (Math.abs(leftKneeY - rightKneeY) > 0.05) {
        score -= 10 * deductionMultiplier;
        feedback.push('양쪽 무릎 높이를 맞춰주세요');
      }

      // 3. 무릎 Valgus (정면 - 무릎이 안쪽으로 모이는 현상)
      if (mode === 'FRONT') {
        const leftKneeX = landmarks[POSE_LANDMARKS.LEFT_KNEE].x;
        const leftAnkleX = landmarks[POSE_LANDMARKS.LEFT_ANKLE].x;
        const rightKneeX = landmarks[POSE_LANDMARKS.RIGHT_KNEE].x;
        const rightAnkleX = landmarks[POSE_LANDMARKS.RIGHT_ANKLE].x;

        // 미러링 고려: 화면상 왼쪽 무릎이 왼쪽 발목보다 안쪽이면 valgus
        if (leftKneeX > leftAnkleX + 0.03 || rightKneeX < rightAnkleX - 0.03) {
          score -= 15 * deductionMultiplier;
          feedback.push('무릎이 안쪽으로 모이고 있어요');
        }
      }

      // ===== 측면 전용 규칙 =====
      if (mode === 'SIDE') {
        // 4. 무릎 전진 (측면에서만 유효)
        const kneeX = landmarks[POSE_LANDMARKS.LEFT_KNEE].x;
        const ankleX = landmarks[POSE_LANDMARKS.LEFT_ANKLE].x;
        if (kneeX < ankleX - 0.08) {
          score -= 15 * deductionMultiplier;
          feedback.push('무릎이 발끝보다 앞으로 나갔어요');
        }

        // 5. 상체 기울기 (측면에서만 유효)
        const shoulderY = landmarks[POSE_LANDMARKS.LEFT_SHOULDER].y;
        const hipY = landmarks[POSE_LANDMARKS.LEFT_HIP].y;
        const shoulderX = landmarks[POSE_LANDMARKS.LEFT_SHOULDER].x;
        const hipX = landmarks[POSE_LANDMARKS.LEFT_HIP].x;

        const torsoAngle =
          Math.atan2(hipY - shoulderY, hipX - shoulderX) * (180 / Math.PI);
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
    },
    []
  );

  /**
   * 캘리브레이션 샘플 추가
   */
  const addCalibrationSample = useCallback(
    (phase: SquatPhase, kneeAngle: number) => {
      if (calibration.isCalibrated) return;

      if (calibrationSamples.current.standing.length >= 5) return;

      if (phase === 'STANDING' && kneeAngle > 150) {
        calibrationSamples.current.standing.push(kneeAngle);
      }
      if (phase === 'BOTTOM' && kneeAngle < 120) {
        calibrationSamples.current.bottom.push(kneeAngle);
      }

      // 3회 이상 수집되면 캘리브레이션 완료
      if (
        calibrationSamples.current.standing.length >= 3 &&
        calibrationSamples.current.bottom.length >= 3
      ) {
        const avgStanding = average(calibrationSamples.current.standing);
        const avgBottom = average(calibrationSamples.current.bottom);
        setCalibration(avgStanding, avgBottom);
      }
    },
    [calibration.isCalibrated, setCalibration]
  );

  /**
   * 메인 분석 함수
   */
  const analyze = useCallback(
    (landmarks: PoseLandmark[]) => {
      // 1. 유효성 검사
      const validity = checkLandmarkValidity(landmarks);
      if (!validity.isValid) {
        setFeedback(validity.message ? [validity.message] : []);
        return;
      }

      // 2. 무릎 각도 계산 + 스무딩
      const rawKneeAngle = calculateKneeAngle(landmarks);
      const kneeAngle = smoothAngle(rawKneeAngle);

      // 3. 임계값 결정
      const thresholds = getThresholds(calibration);

      // 4. phase 결정
      const newPhase = determinePhase(kneeAngle, lastPhaseRef.current, thresholds);

      // 5. 캘리브레이션 샘플 수집
      addCalibrationSample(newPhase, kneeAngle);

      // 6. 반복 완료 감지 (ASCENDING -> STANDING)
      const now = performance.now();
      if (
        lastPhaseRef.current === 'ASCENDING' &&
        newPhase === 'STANDING' &&
        now - lastRepTimeRef.current > MIN_REP_DURATION
      ) {
        // 폼 점수 계산
        const { score, feedback } = calculateFormScore(
          landmarks,
          cameraMode,
          validity.confidence,
          kneeAngle
        );

        incrementRep(score);
        setFeedback(feedback);
        lastRepTimeRef.current = now;
      } else if (newPhase === 'BOTTOM') {
        // BOTTOM에서 실시간 피드백
        const { feedback } = calculateFormScore(
          landmarks,
          cameraMode,
          validity.confidence,
          kneeAngle
        );
        setFeedback(feedback);
      }

      // 7. 상태 업데이트
      lastPhaseRef.current = newPhase;
      lastKneeAngleRef.current = kneeAngle;
      updateAnalysisState(newPhase, kneeAngle);
    },
    [
      checkLandmarkValidity,
      calculateKneeAngle,
      smoothAngle,
      getThresholds,
      calibration,
      determinePhase,
      addCalibrationSample,
      calculateFormScore,
      cameraMode,
      incrementRep,
      setFeedback,
      updateAnalysisState,
    ]
  );

  /**
   * 분석 상태 초기화
   */
  const resetAnalysis = useCallback(() => {
    lastPhaseRef.current = 'STANDING';
    lastRepTimeRef.current = 0;
    lastKneeAngleRef.current = 180;
    angleHistoryRef.current = [];
    calibrationSamples.current = { standing: [], bottom: [] };
  }, []);

  return {
    analyze,
    resetAnalysis,
  };
}

// ===== 유틸리티 함수 =====

/**
 * 세 점 사이의 각도 계산 (도 단위)
 * p1 - p2 - p3 에서 p2가 꼭짓점
 */
function calculateAngle(
  p1: PoseLandmark,
  p2: PoseLandmark,
  p3: PoseLandmark
): number {
  const radians =
    Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs(radians * (180 / Math.PI));

  if (angle > 180) {
    angle = 360 - angle;
  }

  return angle;
}

/**
 * 배열 평균 계산
 */
function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export default useSquatAnalysis;
