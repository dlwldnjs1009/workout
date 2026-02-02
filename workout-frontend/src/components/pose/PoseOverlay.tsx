import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import type { PoseLandmark, SquatPhase } from '../../types';
import { POSE_LANDMARKS } from '../../types';

interface PoseOverlayProps {
  landmarks: PoseLandmark[] | null;
  phase: SquatPhase;
  videoWidth: number;
  videoHeight: number;
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

/**
 * PoseOverlay: 비디오 위에 포즈 랜드마크를 오버레이하는 컴포넌트
 * 
 * - Canvas API로 스켈레톤 및 관절점 렌더링
 * - 스쿼트 phase에 따른 색상 변화
 * - 하체 관절 강조 표시
 */
export function PoseOverlay({
  landmarks,
  phase,
  videoWidth,
  videoHeight,
  mirrored = true,
}: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 크기 설정
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // 클리어
    ctx.clearRect(0, 0, videoWidth, videoHeight);

    if (!landmarks || landmarks.length === 0) return;

    // 미러링 적용
    if (mirrored) {
      ctx.translate(videoWidth, 0);
      ctx.scale(-1, 1);
    }

    // phase별 색상
    const phaseColors: Record<SquatPhase, string> = {
      STANDING: '#4CAF50',  // 녹색
      DESCENDING: '#FFC107', // 노란색
      BOTTOM: '#2196F3',    // 파란색
      ASCENDING: '#FF9800', // 주황색
    };
    const currentColor = phaseColors[phase];

    // 연결선 그리기
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    for (const [startIdx, endIdx] of CONNECTIONS) {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];

      if (!start || !end) continue;
      if (start.visibility < 0.5 || end.visibility < 0.5) continue;

      ctx.beginPath();
      ctx.moveTo(start.x * videoWidth, start.y * videoHeight);
      ctx.lineTo(end.x * videoWidth, end.y * videoHeight);
      ctx.stroke();
    }

    // 관절점 그리기
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (lm.visibility < 0.5) continue;

      const x = lm.x * videoWidth;
      const y = lm.y * videoHeight;

      // 하체 관절은 더 크게 표시
      const isLowerBody = LOWER_BODY_JOINTS.includes(i);
      const radius = isLowerBody ? 8 : 5;

      // 외곽선
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isLowerBody ? currentColor : 'white';
      ctx.fill();
      ctx.strokeStyle = isLowerBody ? 'white' : currentColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 미러링 복원
    if (mirrored) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }, [landmarks, phase, videoWidth, videoHeight, mirrored]);

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
      }}
    />
  );
}

export default PoseOverlay;
