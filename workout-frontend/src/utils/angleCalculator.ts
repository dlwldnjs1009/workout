import type { PoseLandmark } from '../types';

/**
 * angleCalculator.ts
 *
 * 포즈 분석에 사용되는 공통 기하학 계산 함수들
 * 모든 함수는 정규화된 좌표(0-1)를 입력으로 받음
 */

/**
 * 세 점 사이의 각도 계산 (도 단위)
 * p1 - p2 - p3 에서 p2가 꼭짓점
 *
 * @example
 * // 무릎 각도: hip - knee - ankle
 * const kneeAngle = calculateAngle(hip, knee, ankle);
 */
export function calculateAngle(
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
 * 두 점 사이의 유클리드 거리 (정규화된 좌표)
 */
export function calculateDistance(p1: PoseLandmark, p2: PoseLandmark): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 두 점을 연결하는 선의 기울기 각도 (도 단위)
 * 수평선 기준, 시계방향이 양수
 *
 * @example
 * // 상체 기울기: shoulder - hip
 * const torsoAngle = calculateLineAngle(shoulder, hip);
 */
export function calculateLineAngle(p1: PoseLandmark, p2: PoseLandmark): number {
  const radians = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  return radians * (180 / Math.PI);
}

/**
 * Y축 기준 수직선과의 각도 (도 단위)
 * 완전 수직일 때 0도, 앞으로 기울면 양수, 뒤로 기울면 음수
 *
 * @example
 * // 상체 기울기 (수직 기준)
 * const torsoTilt = calculateVerticalAngle(shoulder, hip);
 */
export function calculateVerticalAngle(top: PoseLandmark, bottom: PoseLandmark): number {
  const dx = bottom.x - top.x;
  const dy = bottom.y - top.y;
  // 수직선(90도)과의 차이
  const angle = Math.atan2(dx, dy) * (180 / Math.PI);
  return angle;
}

/**
 * 좌우 비대칭 계산 (%)
 * 두 점의 Y좌표 차이를 신체 높이 대비 비율로 반환
 *
 * @param leftPoint 왼쪽 관절
 * @param rightPoint 오른쪽 관절
 * @param bodyHeight 기준 높이 (보통 어깨-골반 거리)
 */
export function calculateAsymmetry(
  leftPoint: PoseLandmark,
  rightPoint: PoseLandmark,
  bodyHeight: number
): number {
  if (bodyHeight === 0) return 0;
  const diff = Math.abs(leftPoint.y - rightPoint.y);
  return (diff / bodyHeight) * 100;
}

/**
 * 두 점의 X좌표 차이 (정규화)
 * 정면 카메라에서 팔 벌림 정도 측정용
 */
export function calculateHorizontalSpread(
  leftPoint: PoseLandmark,
  rightPoint: PoseLandmark
): number {
  return Math.abs(rightPoint.x - leftPoint.x);
}

/**
 * 랜드마크 visibility 평균 계산
 */
export function calculateAverageVisibility(landmarks: PoseLandmark[], indices: number[]): number {
  if (indices.length === 0) return 0;
  const sum = indices.reduce((acc, idx) => {
    const lm = landmarks[idx];
    return acc + (lm ? lm.visibility : 0);
  }, 0);
  return sum / indices.length;
}

/**
 * 배열 평균 계산
 */
export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * 값을 특정 범위로 클램프
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 이동 평균 계산 (스무딩용)
 */
export function smoothValue(history: number[], newValue: number, windowSize: number): number {
  history.push(newValue);
  if (history.length > windowSize) {
    history.shift();
  }
  return average(history);
}

/**
 * 각도 변화량 계산 (절대값)
 */
export function calculateAngleChange(currentAngle: number, previousAngle: number): number {
  return Math.abs(currentAngle - previousAngle);
}

/**
 * ROM(Range of Motion) 비율 계산 (0-100%)
 *
 * @param current 현재 값
 * @param extended 시작 위치 값
 * @param contracted 최대 수축 위치 값
 */
export function calculateRomPercentage(
  current: number,
  extended: number,
  contracted: number
): number {
  const totalRange = Math.abs(contracted - extended);
  if (totalRange === 0) return 0;

  const progress = Math.abs(current - extended);
  return clamp((progress / totalRange) * 100, 0, 100);
}

/**
 * visibility 기반으로 더 잘 보이는 쪽의 랜드마크 인덱스 반환
 *
 * @param landmarks 전체 랜드마크 배열
 * @param leftIdx 왼쪽 랜드마크 인덱스
 * @param rightIdx 오른쪽 랜드마크 인덱스
 * @returns 더 visible한 쪽의 인덱스
 *
 * @example
 * // 더 잘 보이는 어깨 선택
 * const shoulderIdx = pickVisibleSide(landmarks, LEFT_SHOULDER, RIGHT_SHOULDER);
 */
export function pickVisibleSide(
  landmarks: PoseLandmark[],
  leftIdx: number,
  rightIdx: number
): number {
  const left = landmarks[leftIdx];
  const right = landmarks[rightIdx];
  return (left?.visibility ?? 0) >= (right?.visibility ?? 0) ? leftIdx : rightIdx;
}
