import { useCallback, useRef } from 'react';
import { usePoseStore } from '../store/poseStore';
import type {
  PoseLandmark,
  BackExerciseType,
  PullingPhase,
  LandmarkConfidence,
  BackCalibration,
  FeedbackMessage,
} from '../types';
import { POSE_LANDMARKS } from '../types';
import {
  calculateAngle,
  calculateVerticalAngle,
  calculateAsymmetry,
  calculateHorizontalSpread,
  calculateAverageVisibility,
  calculateRomPercentage,
  pickVisibleSide,
  average,
  smoothValue,
  clamp,
} from '../utils/angleCalculator';

// ===== 임계값 설정 (보수적 - 손들고 촬영 고려) =====
const THRESHOLDS = {
  // 반동 감지: 상체 기울기 변화 > 25° (보수적)
  MOMENTUM_ANGLE: 25,
  // 템포: 당김/복귀 구간 < 0.5초면 너무 빠름
  MIN_TEMPO_MS: 500,
  // ROM 부족: 전체 ROM의 70% 미만
  MIN_ROM_PERCENT: 70,
  // 어깨 으쓱: 어깨 y가 귀 방향으로 상승
  SHOULDER_SHRUG_THRESHOLD: 0.03,
  // 팔꿈치 굽힘 (스트레이트암): 160° 미만이면 경고
  STRAIGHT_ARM_MIN_ANGLE: 160,
  // 좌우 비대칭: 5% 이상 차이
  ASYMMETRY_THRESHOLD: 5,
  // visibility 최소값
  MIN_VISIBILITY: 0.5,
  // 최소 rep 간격 (ms)
  MIN_REP_DURATION: 800,
};

// 캘리브레이션 샘플 수
const CALIBRATION_SAMPLES_NEEDED = 3;

interface UseBackExerciseAnalysisReturn {
  analyze: (landmarks: PoseLandmark[], exerciseType: BackExerciseType) => void;
  resetAnalysis: () => void;
}

/**
 * useBackExerciseAnalysis: 등 운동 자세 분석 훅
 *
 * 지원 운동:
 * - SEATED_ROW (측면): 팔꿈치 x 이동 + 상체 반동 감지
 * - REAR_DELT (정면): 손목 x 벌어짐 + 좌우 비대칭 감지
 * - LAT_PULLDOWN (측면): 손목 y 하강 + 어깨 으쓱 감지
 * - STRAIGHT_ARM (측면): 손목 y 하강 + 팔꿈치 굽힘 감지 (핵심!)
 *
 * 피드백 규칙 6개:
 * 1. 반동 과다 (상체 기울기 변화 > 25°)
 * 2. 템포 너무 빠름 (< 0.5초)
 * 3. ROM 부족 (< 70%)
 * 4. 어깨 으쓱 (로우, 랫풀다운)
 * 5. 좌우 비대칭 (> 5%, 정면 모드)
 * 6. 팔꿈치 굽힘 과다 (< 160°, 스트레이트암)
 */
export function useBackExerciseAnalysis(): UseBackExerciseAnalysisReturn {
  const {
    incrementRep,
    setFeedback,
    updatePullingPhase,
    setBackCalibration,
    backCalibration,
  } = usePoseStore();

  // 상태 추적용 refs
  const lastPhaseRef = useRef<PullingPhase>('EXTENDED');
  const lastRepTimeRef = useRef<number>(0);
  const repStartTimeRef = useRef<number>(0);

  // 스무딩용 히스토리
  const torsoAngleHistoryRef = useRef<number[]>([]);
  const elbowXHistoryRef = useRef<number[]>([]);
  const wristSpreadHistoryRef = useRef<number[]>([]);
  const wristYHistoryRef = useRef<number[]>([]);
  const elbowAngleHistoryRef = useRef<number[]>([]);

  // 캘리브레이션 샘플
  const calibrationSamplesRef = useRef<{
    extended: number[];
    contracted: number[];
    torsoBase: number[];
  }>({ extended: [], contracted: [], torsoBase: [] });

  // rep 중 최대/최소 추적
  const repMetricsRef = useRef<{
    maxTorsoSwing: number;
    maxRom: number; // rep 동안의 최대 ROM 추적
    tempoMs: number;
    minElbowAngle: number; // 스트레이트암: 팔꿈치 최소 각도 추적
  }>({ maxTorsoSwing: 0, maxRom: 0, tempoMs: 0, minElbowAngle: 180 });

  /**
   * 랜드마크 유효성 검사
   * 측면 운동: 가시성이 높은 쪽(왼쪽/오른쪽)을 자동 선택하여 양방향 촬영 지원
   */
  const checkValidity = useCallback(
    (
      landmarks: PoseLandmark[],
      exerciseType: BackExerciseType
    ): { isValid: boolean; confidence: LandmarkConfidence; message?: string } => {
      // 운동별 핵심 랜드마크
      let keyIndices: number[];

      if (exerciseType === 'REAR_DELT') {
        // 정면 모드: 양쪽 모두 필요
        keyIndices = [
          POSE_LANDMARKS.LEFT_SHOULDER,
          POSE_LANDMARKS.RIGHT_SHOULDER,
          POSE_LANDMARKS.LEFT_ELBOW,
          POSE_LANDMARKS.RIGHT_ELBOW,
          POSE_LANDMARKS.LEFT_WRIST,
          POSE_LANDMARKS.RIGHT_WRIST,
        ];
      } else {
        // 측면 모드: 가시성이 높은 쪽 기준으로 검사 (왼쪽/오른쪽 방향 모두 지원)
        const shoulderIdx = pickVisibleSide(
          landmarks,
          POSE_LANDMARKS.LEFT_SHOULDER,
          POSE_LANDMARKS.RIGHT_SHOULDER
        );
        const isLeft = shoulderIdx === POSE_LANDMARKS.LEFT_SHOULDER;

        keyIndices = [
          shoulderIdx,
          isLeft ? POSE_LANDMARKS.LEFT_ELBOW : POSE_LANDMARKS.RIGHT_ELBOW,
          isLeft ? POSE_LANDMARKS.LEFT_WRIST : POSE_LANDMARKS.RIGHT_WRIST,
          isLeft ? POSE_LANDMARKS.LEFT_HIP : POSE_LANDMARKS.RIGHT_HIP,
        ];
      }

      for (const idx of keyIndices) {
        const lm = landmarks[idx];
        if (!lm || (lm.presence ?? 1) < 0.5) {
          return {
            isValid: false,
            confidence: 'LOW',
            message: '카메라 위치를 조정해주세요',
          };
        }
      }

      const avgVis = calculateAverageVisibility(landmarks, keyIndices);
      if (avgVis < THRESHOLDS.MIN_VISIBILITY) {
        return {
          isValid: false,
          confidence: 'LOW',
          message: '관절이 가려져 있습니다. 카메라 위치를 조정해주세요',
        };
      }

      if (avgVis < 0.75) {
        return { isValid: true, confidence: 'MEDIUM' };
      }

      return { isValid: true, confidence: 'HIGH' };
    },
    []
  );

  /**
   * 상체 기울기 계산 (측면 모드)
   * visibility 기반으로 더 잘 보이는 쪽 사용
   * 어깨와 골반은 같은 쪽을 사용해야 대각선 오차 방지
   */
  const calculateTorsoAngle = useCallback((landmarks: PoseLandmark[]): number => {
    const shoulderIdx = pickVisibleSide(
      landmarks,
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER
    );
    // 어깨와 같은 쪽의 골반 사용 (대각선 방지)
    const hipIdx = shoulderIdx === POSE_LANDMARKS.LEFT_SHOULDER
      ? POSE_LANDMARKS.LEFT_HIP
      : POSE_LANDMARKS.RIGHT_HIP;
    return calculateVerticalAngle(landmarks[shoulderIdx], landmarks[hipIdx]);
  }, []);

  /**
   * 팔꿈치 X 위치 (측면 모드 - 로우)
   */
  const getElbowX = useCallback((landmarks: PoseLandmark[]): number => {
    // 더 visible한 쪽 사용
    const leftElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
    const rightElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];

    if (leftElbow.visibility > rightElbow.visibility) {
      return leftElbow.x;
    }
    return rightElbow.x;
  }, []);

  /**
   * 손목 수평 벌어짐 (정면 모드 - 리어델트)
   */
  const getWristSpread = useCallback((landmarks: PoseLandmark[]): number => {
    const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
    const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
    return calculateHorizontalSpread(leftWrist, rightWrist);
  }, []);

  /**
   * 손목 Y 위치 (측면 모드 - 랫풀다운, 스트레이트암)
   * Y 좌표가 작을수록 위쪽, 클수록 아래쪽
   */
  const getWristY = useCallback((landmarks: PoseLandmark[]): number => {
    const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
    const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];

    // 더 visible한 쪽 사용
    if (leftWrist.visibility > rightWrist.visibility) {
      return leftWrist.y;
    }
    return rightWrist.y;
  }, []);

  /**
   * 팔꿈치 각도 계산 (스트레이트암 - 팔꿈치가 펴져있어야 함)
   * 어깨-팔꿈치-손목 각도
   */
  const getElbowAngle = useCallback((landmarks: PoseLandmark[]): number => {
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const leftElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
    const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const rightElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
    const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];

    const leftAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);

    // 더 visible한 쪽 사용
    if (leftElbow.visibility > rightElbow.visibility) {
      return leftAngle;
    }
    return rightAngle;
  }, []);

  /**
   * 어깨 으쓱 감지
   */
  const detectShoulderShrug = useCallback((landmarks: PoseLandmark[]): boolean => {
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const leftEar = landmarks[POSE_LANDMARKS.LEFT_EAR];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const rightEar = landmarks[POSE_LANDMARKS.RIGHT_EAR];

    // 어깨가 귀에 가까워지면 으쓱
    const leftDiff = leftEar.y - leftShoulder.y;
    const rightDiff = rightEar.y - rightShoulder.y;

    return leftDiff < THRESHOLDS.SHOULDER_SHRUG_THRESHOLD ||
           rightDiff < THRESHOLDS.SHOULDER_SHRUG_THRESHOLD;
  }, []);

  /**
   * 좌우 비대칭 계산 (정면 모드)
   */
  const calculateBodyAsymmetry = useCallback((landmarks: PoseLandmark[]): number => {
    const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
    const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];

    const bodyHeight = Math.abs(leftHip.y - leftShoulder.y);
    return calculateAsymmetry(leftWrist, rightWrist, bodyHeight);
  }, []);

  /**
   * 로우(측면) phase 결정
   */
  const determineRowPhase = useCallback(
    (
      elbowX: number,
      shoulderX: number,
      prevPhase: PullingPhase,
      calibration: BackCalibration
    ): PullingPhase => {
      // 팔꿈치가 어깨보다 뒤로 빠지면 수축
      const pullRatio = calibration.isCalibrated
        ? calculateRomPercentage(
            elbowX,
            calibration.extendedPosition,
            calibration.contractedPosition
          )
        : elbowX < shoulderX
        ? 70
        : 30;

      switch (prevPhase) {
        case 'EXTENDED':
          if (pullRatio > 40) return 'PULLING';
          break;
        case 'PULLING':
          if (pullRatio >= 80) return 'CONTRACTED';
          if (pullRatio < 30) return 'EXTENDED';
          break;
        case 'CONTRACTED':
          if (pullRatio < 70) return 'RETURNING';
          break;
        case 'RETURNING':
          if (pullRatio < 30) return 'EXTENDED';
          if (pullRatio > 70) return 'CONTRACTED';
          break;
      }

      return prevPhase;
    },
    []
  );

  /**
   * 리어델트(정면) phase 결정
   */
  const determineRearDeltPhase = useCallback(
    (
      wristSpread: number,
      prevPhase: PullingPhase,
      calibration: BackCalibration
    ): PullingPhase => {
      const spreadRatio = calibration.isCalibrated
        ? calculateRomPercentage(
            wristSpread,
            calibration.extendedPosition,
            calibration.contractedPosition
          )
        : wristSpread > 0.5
        ? 80
        : 30;

      switch (prevPhase) {
        case 'EXTENDED':
          if (spreadRatio > 40) return 'PULLING';
          break;
        case 'PULLING':
          if (spreadRatio >= 80) return 'CONTRACTED';
          if (spreadRatio < 30) return 'EXTENDED';
          break;
        case 'CONTRACTED':
          if (spreadRatio < 70) return 'RETURNING';
          break;
        case 'RETURNING':
          if (spreadRatio < 30) return 'EXTENDED';
          if (spreadRatio > 70) return 'CONTRACTED';
          break;
      }

      return prevPhase;
    },
    []
  );

  /**
   * 랫풀다운/스트레이트암(측면) phase 결정
   * 손목 Y 좌표 기반 (아래로 내려갈수록 Y 증가)
   */
  const determineVerticalPullPhase = useCallback(
    (
      wristY: number,
      hipY: number,
      prevPhase: PullingPhase,
      calibration: BackCalibration
    ): PullingPhase => {
      // 캘리브레이션 되어있으면 ROM 비율로, 아니면 골반 기준으로 판단
      const pullRatio = calibration.isCalibrated
        ? calculateRomPercentage(
            wristY,
            calibration.extendedPosition,
            calibration.contractedPosition
          )
        : wristY > hipY - 0.1
        ? 80 // 손목이 골반 근처면 수축
        : 30;

      switch (prevPhase) {
        case 'EXTENDED':
          if (pullRatio > 40) return 'PULLING';
          break;
        case 'PULLING':
          if (pullRatio >= 80) return 'CONTRACTED';
          if (pullRatio < 30) return 'EXTENDED';
          break;
        case 'CONTRACTED':
          if (pullRatio < 70) return 'RETURNING';
          break;
        case 'RETURNING':
          if (pullRatio < 30) return 'EXTENDED';
          if (pullRatio > 70) return 'CONTRACTED';
          break;
      }

      return prevPhase;
    },
    []
  );

  /**
   * 캘리브레이션 샘플 추가
   */
  const addCalibrationSample = useCallback(
    (phase: PullingPhase, positionValue: number, torsoAngle: number) => {
      if (backCalibration.isCalibrated) return;

      const samples = calibrationSamplesRef.current;

      if (phase === 'EXTENDED' && samples.extended.length < CALIBRATION_SAMPLES_NEEDED) {
        samples.extended.push(positionValue);
        samples.torsoBase.push(torsoAngle);
      }
      if (phase === 'CONTRACTED' && samples.contracted.length < CALIBRATION_SAMPLES_NEEDED) {
        samples.contracted.push(positionValue);
      }

      // 캘리브레이션 완료 체크
      if (
        samples.extended.length >= CALIBRATION_SAMPLES_NEEDED &&
        samples.contracted.length >= CALIBRATION_SAMPLES_NEEDED
      ) {
        setBackCalibration(
          average(samples.extended),
          average(samples.contracted),
          average(samples.torsoBase)
        );
      }
    },
    [backCalibration.isCalibrated, setBackCalibration]
  );

  /**
   * 폼 점수 및 피드백 계산
   */
  const calculateFormFeedback = useCallback(
    (
      landmarks: PoseLandmark[],
      exerciseType: BackExerciseType,
      confidence: LandmarkConfidence,
      currentRom: number,
      torsoSwing: number,
      tempoMs: number,
      asymmetry: number,
      minElbowAngle: number = 180
    ): { score: number; feedback: FeedbackMessage[] } => {
      const feedback: FeedbackMessage[] = [];
      let score = 100;

      const deductionMultiplier =
        confidence === 'HIGH' ? 1 : confidence === 'MEDIUM' ? 0.7 : 0.5;

      // 1. 반동 과다
      if (torsoSwing > THRESHOLDS.MOMENTUM_ANGLE) {
        score -= 20 * deductionMultiplier;
        feedback.push({
          rule: 'EXCESSIVE_MOMENTUM',
          message: '상체 반동이 크네요. 고정하고 당겨보세요',
          severity: 'warning',
        });
      }

      // 2. 템포 너무 빠름
      if (tempoMs > 0 && tempoMs < THRESHOLDS.MIN_TEMPO_MS) {
        score -= 10 * deductionMultiplier;
        feedback.push({
          rule: 'TOO_FAST',
          message: '조금 더 천천히 수행해보세요',
          severity: 'info',
        });
      }

      // 3. ROM 부족 (캘리브레이션 전 -1이면 평가 제외)
      if (currentRom >= 0 && currentRom < THRESHOLDS.MIN_ROM_PERCENT) {
        score -= 15 * deductionMultiplier;
        feedback.push({
          rule: 'ROM_INSUFFICIENT',
          message: '가동범위를 더 크게 사용해보세요',
          severity: 'warning',
        });
      }

      // 4. 어깨 으쓱 (로우, 랫풀다운)
      if (
        (exerciseType === 'SEATED_ROW' || exerciseType === 'LAT_PULLDOWN') &&
        detectShoulderShrug(landmarks)
      ) {
        score -= 10 * deductionMultiplier;
        feedback.push({
          rule: 'SHOULDER_SHRUG',
          message: '어깨를 내리고 견갑을 조여주세요',
          severity: 'warning',
        });
      }

      // 5. 좌우 비대칭 (정면 모드)
      if (exerciseType === 'REAR_DELT' && asymmetry > THRESHOLDS.ASYMMETRY_THRESHOLD) {
        score -= 10 * deductionMultiplier;
        feedback.push({
          rule: 'ASYMMETRY',
          message: `좌우 높이가 ${asymmetry.toFixed(0)}% 차이나요`,
          severity: 'info',
        });
      }

      // 6. 팔꿈치 굽힘 과다 (스트레이트암 - 핵심 규칙!)
      if (exerciseType === 'STRAIGHT_ARM' && minElbowAngle < THRESHOLDS.STRAIGHT_ARM_MIN_ANGLE) {
        score -= 20 * deductionMultiplier;
        feedback.push({
          rule: 'ELBOW_BEND',
          message: '팔꿈치를 펴고 수행하세요. 이두가 개입되고 있어요',
          severity: 'warning',
        });
      }

      // 좋은 폼
      if (feedback.length === 0) {
        feedback.push({
          rule: 'GOOD_FORM',
          message: '좋은 폼입니다!',
          severity: 'info',
        });
      }

      return { score: clamp(score, 0, 100), feedback };
    },
    [detectShoulderShrug]
  );

  /**
   * 메인 분석 함수
   */
  const analyze = useCallback(
    (landmarks: PoseLandmark[], exerciseType: BackExerciseType) => {
      // 1. 유효성 검사
      const validity = checkValidity(landmarks, exerciseType);
      if (!validity.isValid) {
        setFeedback(validity.message ? [validity.message] : []);
        return;
      }

      const now = performance.now();

      // 2. 측정값 계산
      const torsoAngle = calculateTorsoAngle(landmarks);
      const smoothedTorsoAngle = smoothValue(torsoAngleHistoryRef.current, torsoAngle, 3);

      let positionValue: number;
      let newPhase: PullingPhase;
      let asymmetry = 0;

      let elbowAngle = 180; // 스트레이트암용

      if (exerciseType === 'REAR_DELT') {
        // 정면 모드: 손목 벌어짐
        const wristSpread = getWristSpread(landmarks);
        positionValue = smoothValue(wristSpreadHistoryRef.current, wristSpread, 3);
        newPhase = determineRearDeltPhase(positionValue, lastPhaseRef.current, backCalibration);
        asymmetry = calculateBodyAsymmetry(landmarks);
      } else if (exerciseType === 'LAT_PULLDOWN' || exerciseType === 'STRAIGHT_ARM') {
        // 측면 모드: 손목 Y 좌표 (수직 당김)
        const wristY = getWristY(landmarks);
        // visibility 기반으로 더 잘 보이는 쪽의 골반 사용
        const hipIdx = pickVisibleSide(landmarks, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP);
        const hipY = landmarks[hipIdx].y;
        positionValue = smoothValue(wristYHistoryRef.current, wristY, 3);
        newPhase = determineVerticalPullPhase(positionValue, hipY, lastPhaseRef.current, backCalibration);

        // 스트레이트암: 팔꿈치 각도 추적
        if (exerciseType === 'STRAIGHT_ARM') {
          elbowAngle = smoothValue(elbowAngleHistoryRef.current, getElbowAngle(landmarks), 3);
        }
      } else {
        // SEATED_ROW: 측면 모드 팔꿈치 X
        const elbowX = getElbowX(landmarks);
        // visibility 기반으로 더 잘 보이는 쪽의 어깨 사용
        const shoulderIdx = pickVisibleSide(
          landmarks,
          POSE_LANDMARKS.LEFT_SHOULDER,
          POSE_LANDMARKS.RIGHT_SHOULDER
        );
        const shoulderX = landmarks[shoulderIdx].x;
        positionValue = smoothValue(elbowXHistoryRef.current, elbowX, 3);
        newPhase = determineRowPhase(positionValue, shoulderX, lastPhaseRef.current, backCalibration);
      }

      // 3. 캘리브레이션 샘플 수집
      addCalibrationSample(newPhase, positionValue, smoothedTorsoAngle);

      // 4. rep 중 메트릭 추적
      const torsoSwing = Math.abs(
        smoothedTorsoAngle - (backCalibration.torsoBaseAngle || smoothedTorsoAngle)
      );

      if (newPhase === 'PULLING' || newPhase === 'CONTRACTED') {
        if (lastPhaseRef.current === 'EXTENDED') {
          // rep 시작
          repStartTimeRef.current = now;
          repMetricsRef.current = { maxTorsoSwing: 0, maxRom: 0, tempoMs: 0, minElbowAngle: 180 };
        }
        repMetricsRef.current.maxTorsoSwing = Math.max(
          repMetricsRef.current.maxTorsoSwing,
          torsoSwing
        );
        // rep 진행 중 maxRom 추적
        if (backCalibration.isCalibrated) {
          const currentRom = calculateRomPercentage(
            positionValue,
            backCalibration.extendedPosition,
            backCalibration.contractedPosition
          );
          repMetricsRef.current.maxRom = Math.max(
            repMetricsRef.current.maxRom,
            currentRom
          );
        }
        // 스트레이트암: 팔꿈치 최소 각도 추적
        if (exerciseType === 'STRAIGHT_ARM') {
          repMetricsRef.current.minElbowAngle = Math.min(
            repMetricsRef.current.minElbowAngle,
            elbowAngle
          );
        }
      }

      // 5. Rep 완료 감지 (RETURNING -> EXTENDED)
      if (
        lastPhaseRef.current === 'RETURNING' &&
        newPhase === 'EXTENDED' &&
        now - lastRepTimeRef.current > THRESHOLDS.MIN_REP_DURATION
      ) {
        const tempoMs = now - repStartTimeRef.current;
        // rep 동안 추적한 최대 ROM 사용 (EXTENDED 시점이 아닌 실제 가동범위)
        // 캘리브레이션 전에는 -1 sentinel로 ROM 평가 제외
        const repRom = backCalibration.isCalibrated
          ? repMetricsRef.current.maxRom
          : -1;

        const { score, feedback } = calculateFormFeedback(
          landmarks,
          exerciseType,
          validity.confidence,
          repRom,
          repMetricsRef.current.maxTorsoSwing,
          tempoMs,
          asymmetry,
          repMetricsRef.current.minElbowAngle
        );

        incrementRep(score);
        setFeedback(feedback.map((f) => f.message));
        lastRepTimeRef.current = now;
      } else if (newPhase === 'CONTRACTED') {
        // CONTRACTED에서 실시간 피드백
        const { feedback } = calculateFormFeedback(
          landmarks,
          exerciseType,
          validity.confidence,
          80, // 실시간은 ROM 체크 skip
          torsoSwing,
          0,
          asymmetry,
          elbowAngle
        );
        setFeedback(feedback.map((f) => f.message));
      }

      // 6. 상태 업데이트
      lastPhaseRef.current = newPhase;
      updatePullingPhase(newPhase);
    },
    [
      checkValidity,
      calculateTorsoAngle,
      getWristSpread,
      getWristY,
      getElbowX,
      getElbowAngle,
      determineRearDeltPhase,
      determineRowPhase,
      determineVerticalPullPhase,
      addCalibrationSample,
      calculateBodyAsymmetry,
      calculateFormFeedback,
      backCalibration,
      incrementRep,
      setFeedback,
      updatePullingPhase,
    ]
  );

  /**
   * 분석 상태 초기화
   */
  const resetAnalysis = useCallback(() => {
    lastPhaseRef.current = 'EXTENDED';
    lastRepTimeRef.current = 0;
    repStartTimeRef.current = 0;
    torsoAngleHistoryRef.current = [];
    elbowXHistoryRef.current = [];
    wristSpreadHistoryRef.current = [];
    wristYHistoryRef.current = [];
    elbowAngleHistoryRef.current = [];
    calibrationSamplesRef.current = { extended: [], contracted: [], torsoBase: [] };
    repMetricsRef.current = { maxTorsoSwing: 0, maxRom: 0, tempoMs: 0, minElbowAngle: 180 };
  }, []);

  return {
    analyze,
    resetAnalysis,
  };
}

export default useBackExerciseAnalysis;
