import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Cameraswitch,
  Close,
  RestartAlt,
  Person,
  PersonOutline,
} from '@mui/icons-material';

import { useCamera } from '../../hooks/useCamera';
import { usePoseDetection } from '../../hooks/usePoseDetection';
import { useSquatAnalysis } from '../../hooks/useSquatAnalysis';
import { usePoseStore, selectAverageFormScore } from '../../store/poseStore';
import type { CameraMode } from '../../types';

import { CameraFeed } from './CameraFeed';
import { PoseOverlay } from './PoseOverlay';
import { FeedbackPanel } from './FeedbackPanel';

interface PoseAnalysisViewProps {
  onClose?: () => void;
  onSessionComplete?: (data: { repCount: number; avgFormScore: number }) => void;
}

/**
 * PoseAnalysisView: 포즈 분석 전체 UI를 통합하는 메인 컴포넌트
 * 
 * - 카메라 피드 + 포즈 오버레이
 * - 실시간 피드백 패널
 * - 카메라 모드 전환 (정면/측면)
 * - 세션 시작/중지/리셋
 */
export function PoseAnalysisView({ onClose, onSessionComplete }: PoseAnalysisViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 });

  // 카메라 훅
  const {
    videoRef,
    cameraStatus,
    cameraMode,
    error: cameraError,
    startCamera,
    stopCamera,
    switchCamera,
    setCameraMode,
  } = useCamera({ width: 640, height: 480, frameRate: 30 });

  // 포즈 감지 훅
  const {
    isInitialized,
    isDetecting,
    fps,
    landmarks,
    error: poseError,
    startDetection,
    stopDetection,
  } = usePoseDetection(videoRef);

  // 스쿼트 분석 훅
  const { analyze, resetAnalysis } = useSquatAnalysis();

  // 스토어 상태
  const {
    currentPhase,
    currentKneeAngle,
    repCount,
    lastFeedback,
    sessionFormScores,
    calibration,
    resetSession,
  } = usePoseStore();

  const averageFormScore = usePoseStore(selectAverageFormScore);

  // 비디오 크기 업데이트
  const handleVideoReady = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setVideoDimensions({
        width: video.videoWidth || 640,
        height: video.videoHeight || 480,
      });
    }
  }, [videoRef]);

  // 분석 실행
  useEffect(() => {
    if (isDetecting && landmarks) {
      analyze(landmarks);
    }
  }, [isDetecting, landmarks, analyze]);

  // 세션 시작
  const handleStart = useCallback(async () => {
    await startCamera();
    startDetection();
  }, [startCamera, startDetection]);

  // 세션 중지
  const handleStop = useCallback(() => {
    stopDetection();
    stopCamera();

    // 콜백 호출
    if (repCount > 0 && onSessionComplete) {
      onSessionComplete({
        repCount,
        avgFormScore: averageFormScore,
      });
    }
  }, [stopDetection, stopCamera, repCount, averageFormScore, onSessionComplete]);

  // 세션 리셋
  const handleReset = useCallback(() => {
    resetSession();
    resetAnalysis();
  }, [resetSession, resetAnalysis]);

  // 카메라 모드 변경
  const handleCameraModeChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, newMode: CameraMode | null) => {
      if (newMode) {
        setCameraMode(newMode);
      }
    },
    [setCameraMode]
  );

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopDetection();
      stopCamera();
    };
  }, [stopDetection, stopCamera]);

  const lastFormScore =
    sessionFormScores.length > 0
      ? sessionFormScores[sessionFormScores.length - 1]
      : 0;

  const isActive = cameraStatus === 'ACTIVE' && isDetecting;

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* 헤더 */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          스쿼트 자세 분석
        </Typography>

        <Stack direction="row" spacing={1}>
          {/* 카메라 모드 토글 */}
          <ToggleButtonGroup
            value={cameraMode}
            exclusive
            onChange={handleCameraModeChange}
            size="small"
            disabled={isActive}
          >
            <ToggleButton value="FRONT">
              <Tooltip title="정면">
                <Person fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="SIDE">
              <Tooltip title="측면">
                <PersonOutline fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          {/* 닫기 버튼 */}
          {onClose && (
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          )}
        </Stack>
      </Box>

      {/* 카메라 피드 + 오버레이 */}
      <Box sx={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <CameraFeed
          ref={videoRef}
          cameraStatus={cameraStatus}
          error={cameraError || poseError}
          onVideoReady={handleVideoReady}
          width="100%"
          height="100%"
        />

        {/* 포즈 오버레이 */}
        {isActive && landmarks && (
          <PoseOverlay
            landmarks={landmarks}
            phase={currentPhase}
            videoWidth={videoDimensions.width}
            videoHeight={videoDimensions.height}
            mirrored={true}
          />
        )}

        {/* 카메라 전환 버튼 (활성 상태에서만) */}
        {isActive && (
          <IconButton
            onClick={switchCamera}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.5)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            }}
          >
            <Cameraswitch sx={{ color: 'white' }} />
          </IconButton>
        )}

        {/* 초기화 메시지 */}
        {!isInitialized && cameraStatus === 'IDLE' && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'rgba(0,0,0,0.7)',
              px: 2,
              py: 1,
              borderRadius: 2,
            }}
          >
            <Typography variant="caption" color="white">
              포즈 감지 모델 로딩 중...
            </Typography>
          </Box>
        )}
      </Box>

      {/* 피드백 패널 */}
      <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
        <FeedbackPanel
          phase={currentPhase}
          kneeAngle={currentKneeAngle}
          repCount={repCount}
          formScore={lastFormScore}
          feedback={lastFeedback}
          fps={fps}
          confidence={
            landmarks
              ? landmarks.every((l) => l.visibility > 0.75)
                ? 'HIGH'
                : landmarks.every((l) => l.visibility > 0.5)
                ? 'MEDIUM'
                : 'LOW'
              : 'LOW'
          }
          calibration={calibration}
          isDetecting={isDetecting}
        />
      </Box>

      {/* 컨트롤 버튼 */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        {!isActive ? (
          <Button
            variant="contained"
            fullWidth
            startIcon={<PlayArrow />}
            onClick={handleStart}
            disabled={!isInitialized}
            size="large"
          >
            시작
          </Button>
        ) : (
          <>
            <Button
              variant="contained"
              color="error"
              fullWidth
              startIcon={<Stop />}
              onClick={handleStop}
              size="large"
            >
              종료
            </Button>
            <Button
              variant="outlined"
              startIcon={<RestartAlt />}
              onClick={handleReset}
              size="large"
            >
              리셋
            </Button>
          </>
        )}
      </Box>

      {/* 안내 텍스트 */}
      {!isActive && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
            {cameraMode === 'FRONT'
              ? '정면 모드: 무릎 방향, 좌우 균형을 분석합니다'
              : '측면 모드: 무릎 위치, 상체 기울기를 분석합니다'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default PoseAnalysisView;
