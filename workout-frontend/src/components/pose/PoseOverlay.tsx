import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import type { PoseLandmark, SquatPhase, PullingPhase, ExerciseCategory } from '../../types';
import { POSE_LANDMARKS } from '../../types';

interface PoseOverlayProps {
  landmarks: PoseLandmark[] | null;
  phase: SquatPhase | PullingPhase;
  exerciseCategory: ExerciseCategory;
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** 비디오 요소 참조 - object-fit: contain 좌표 보정에 필요 */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** 미러링 여부 - FRONT 모드에서 true, SIDE 모드에서 false 권장 */
  mirrored?: boolean;
}

// 연결할 랜드마크 쌍 (스켈레톤 그리기용)
const CONNECTIONS: [number, number][] = [
  // 상체
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  // 몸통
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
  // 하체
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
];

// 하체 관절 인덱스 (스쿼트에서 강조)
const LOWER_BODY_JOINTS: number[] = [
  POSE_LANDMARKS.LEFT_HIP,
  POSE_LANDMARKS.RIGHT_HIP,
  POSE_LANDMARKS.LEFT_KNEE,
  POSE_LANDMARKS.RIGHT_KNEE,
  POSE_LANDMARKS.LEFT_ANKLE,
  POSE_LANDMARKS.RIGHT_ANKLE,
];

// 상체 관절 인덱스 (등 운동에서 강조)
const UPPER_BODY_JOINTS: number[] = [
  POSE_LANDMARKS.LEFT_SHOULDER,
  POSE_LANDMARKS.RIGHT_SHOULDER,
  POSE_LANDMARKS.LEFT_ELBOW,
  POSE_LANDMARKS.RIGHT_ELBOW,
  POSE_LANDMARKS.LEFT_WRIST,
  POSE_LANDMARKS.RIGHT_WRIST,
];

/**
 * object-fit: contain 적용 시 랜드마크 좌표를 화면 좌표로 변환
 *
 * MediaPipe 랜드마크는 원본 비디오 기준 정규화 좌표(0~1)이므로,
 * contain으로 letterbox된 비디오의 실제 렌더링 영역에 맞춰 오프셋 보정 필요
 */
function mapToContainSpace(
  lmX: number,
  lmY: number,
  videoW: number,
  videoH: number,
  viewW: number,
  viewH: number
): { x: number; y: number } {
  // contain: 비디오가 컨테이너 안에 완전히 들어가도록 스케일 (letterbox)
  const scale = Math.min(viewW / videoW, viewH / videoH);
  const renderedW = videoW * scale;
  const renderedH = videoH * scale;

  // 중앙 정렬로 인한 오프셋 (양수 = letterbox 여백)
  const offsetX = (viewW - renderedW) / 2;
  const offsetY = (viewH - renderedH) / 2;

  return {
    x: lmX * renderedW + offsetX,
    y: lmY * renderedH + offsetY,
  };
}

/**
 * PoseOverlay: 비디오 위에 포즈 랜드마크를 오버레이하는 컴포넌트
 *
 * - Canvas API로 스켈레톤 및 관절점 렌더링
 * - 운동 phase에 따른 색상 변화
 * - 운동 카테고리에 따라 강조할 관절 변경 (하체/상체)
 * - 비디오가 CSS로 미러링되므로 캔버스도 CSS로 미러링
 */
export function PoseOverlay({
  landmarks,
  phase,
  exerciseCategory,
  containerRef,
  videoRef,
  mirrored = true,
}: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const video = videoRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 컨테이너의 실제 크기로 캔버스 설정
    const rect = container.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    // 비디오 원본 해상도 (cover 매핑에 필요)
    const videoW = video?.videoWidth || displayWidth;
    const videoH = video?.videoHeight || displayHeight;

    // 고해상도 디스플레이 지원 (선명하게)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    // 클리어
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    if (!landmarks || landmarks.length === 0) return;

    // 스쿼트 phase별 색상
    const squatPhaseColors: Record<SquatPhase, string> = {
      STANDING: '#4CAF50', // 녹색
      DESCENDING: '#FFC107', // 노란색
      BOTTOM: '#2196F3', // 파란색
      ASCENDING: '#FF9800', // 주황색
    };

    // 등 운동 phase별 색상
    const pullingPhaseColors: Record<PullingPhase, string> = {
      EXTENDED: '#4CAF50', // 녹색
      PULLING: '#FFC107', // 노란색
      CONTRACTED: '#2196F3', // 파란색
      RETURNING: '#FF9800', // 주황색
    };

    const currentColor =
      exerciseCategory === 'SQUAT'
        ? squatPhaseColors[phase as SquatPhase]
        : pullingPhaseColors[phase as PullingPhase];

    // 강조할 관절 선택
    const highlightJoints =
      exerciseCategory === 'SQUAT' ? LOWER_BODY_JOINTS : UPPER_BODY_JOINTS;

    // 연결선 그리기
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    for (const [startIdx, endIdx] of CONNECTIONS) {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];

      if (!start || !end) continue;
      if (start.visibility < 0.5 || end.visibility < 0.5) continue;

      // object-fit: contain 보정된 좌표 사용
      const s = mapToContainSpace(start.x, start.y, videoW, videoH, displayWidth, displayHeight);
      const e = mapToContainSpace(end.x, end.y, videoW, videoH, displayWidth, displayHeight);

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(e.x, e.y);
      ctx.stroke();
    }

    // 관절점 그리기
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (lm.visibility < 0.5) continue;

      // object-fit: contain 보정된 좌표 사용
      const { x, y } = mapToContainSpace(lm.x, lm.y, videoW, videoH, displayWidth, displayHeight);

      // 운동 카테고리에 따라 강조할 관절 결정
      const isHighlighted = highlightJoints.includes(i);
      const radius = isHighlighted ? 10 : 6;

      // 외곽선
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isHighlighted ? currentColor : 'white';
      ctx.fill();
      ctx.strokeStyle = isHighlighted ? 'white' : currentColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [landmarks, phase, exerciseCategory, containerRef, videoRef, mirrored]);

  return (
    <Box
      component="canvas"
      ref={canvasRef}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        // 비디오와 동일하게 미러링 (CSS로 처리)
        // FRONT 모드: 미러링 (거울처럼), SIDE 모드: 미러링 없음
        transform: mirrored ? 'scaleX(-1)' : 'none',
      }}
    />
  );
}

export default PoseOverlay;
