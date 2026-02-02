import { useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Chip,
  Select,
  MenuItem,
  FormControl,
  Alert,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Cameraswitch,
  Close,
  RestartAlt,
  Person,
  PersonOutline,
  FitnessCenter,
} from '@mui/icons-material';

import { useCamera } from '../../hooks/useCamera';
import { usePoseDetection } from '../../hooks/usePoseDetection';
import { useSquatAnalysis } from '../../hooks/useSquatAnalysis';
import { useBackExerciseAnalysis } from '../../hooks/useBackExerciseAnalysis';
import { usePoseStore, selectAverageFormScore } from '../../store/poseStore';
import type { CameraMode, ExerciseCategory, BackExerciseType } from '../../types';
import { EXERCISE_CAMERA_MODE, BACK_EXERCISE_NAMES } from '../../types';

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
 * - 운동 선택 UI (스쿼트/등운동)
 * - 카메라 피드 + 포즈 오버레이
 * - 실시간 피드백 패널
 * - 카메라 모드 전환 (정면/측면)
 * - 세션 시작/중지/리셋
 */
export function PoseAnalysisView({ onClose, onSessionComplete }: PoseAnalysisViewProps) {
  const videoContainerRef = useRef<HTMLDivElement>(null);

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
  const { analyze: analyzeSquat, resetAnalysis: resetSquatAnalysis } = useSquatAnalysis();

  // 등 운동 분석 훅
  const { analyze: analyzeBack, resetAnalysis: resetBackAnalysis } = useBackExerciseAnalysis();

  // 스토어 상태
  const {
    exerciseCategory,
    backExerciseType,
    setExerciseCategory,
    setBackExerciseType,
    currentPhase,
    currentKneeAngle,
    pullingPhase,
    repCount,
    lastFeedback,
    sessionFormScores,
    calibration,
    backCalibration,
    resetSession,
    resetBackCalibration,
  } = usePoseStore();

  const averageFormScore = usePoseStore(selectAverageFormScore);

  // 운동 타입에 따른 권장 카메라 모드
  const recommendedCameraMode =
    exerciseCategory === 'BACK' ? EXERCISE_CAMERA_MODE[backExerciseType] : 'FRONT';

  const isRecommendedMode = cameraMode === recommendedCameraMode;

  // 분석 실행 (운동 카테고리에 따라 분기)
  useEffect(() => {
    if (isDetecting && landmarks) {
      if (exerciseCategory === 'SQUAT') {
        analyzeSquat(landmarks);
      } else {
        analyzeBack(landmarks, backExerciseType);
      }
    }
  }, [isDetecting, landmarks, exerciseCategory, backExerciseType, analyzeSquat, analyzeBack]);

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
    if (exerciseCategory === 'SQUAT') {
      resetSquatAnalysis();
    } else {
      resetBackAnalysis();
      resetBackCalibration();
    }
  }, [resetSession, exerciseCategory, resetSquatAnalysis, resetBackAnalysis, resetBackCalibration]);

  // 카메라 모드 변경
  const handleCameraModeChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, newMode: CameraMode | null) => {
      if (newMode) {
        setCameraMode(newMode);
      }
    },
    [setCameraMode]
  );

  // 운동 카테고리 변경
  const handleExerciseCategoryChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, newCategory: ExerciseCategory | null) => {
      if (newCategory) {
        setExerciseCategory(newCategory);
        // 권장 카메라 모드로 자동 전환
        if (newCategory === 'SQUAT') {
          setCameraMode('FRONT');
        } else {
          setCameraMode(EXERCISE_CAMERA_MODE[backExerciseType]);
        }
      }
    },
    [setExerciseCategory, setCameraMode, backExerciseType]
  );

  // 등 운동 타입 변경
  const handleBackExerciseChange = useCallback(
    (event: { target: { value: unknown } }) => {
      const newType = event.target.value as BackExerciseType;
      setBackExerciseType(newType);
      // 권장 카메라 모드로 자동 전환
      setCameraMode(EXERCISE_CAMERA_MODE[newType]);
    },
    [setBackExerciseType, setCameraMode]
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
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {/* 상단: 제목 + 닫기 */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1.5,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            {exerciseCategory === 'SQUAT'
              ? '스쿼트 자세 분석'
              : `${BACK_EXERCISE_NAMES[backExerciseType]} 자세 분석`}
          </Typography>

          {onClose && (
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          )}
        </Box>

        {/* 운동 선택 + 카메라 모드 */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {/* 운동 카테고리 토글 */}
          <ToggleButtonGroup
            value={exerciseCategory}
            exclusive
            onChange={handleExerciseCategoryChange}
            size="small"
            disabled={isActive}
          >
            <ToggleButton value="SQUAT">
              <Tooltip title="스쿼트">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FitnessCenter fontSize="small" />
                  <Typography variant="caption">하체</Typography>
                </Box>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="BACK">
              <Tooltip title="등 운동">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FitnessCenter fontSize="small" />
                  <Typography variant="caption">등</Typography>
                </Box>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          {/* 등 운동 세부 선택 */}
          {exerciseCategory === 'BACK' && (
            <FormControl size="small" sx={{ minWidth: 140 }} disabled={isActive}>
              <Select
                value={backExerciseType}
                onChange={handleBackExerciseChange}
                displayEmpty
                sx={{ fontSize: '0.875rem' }}
              >
                <MenuItem value="SEATED_ROW">{BACK_EXERCISE_NAMES.SEATED_ROW}</MenuItem>
                <MenuItem value="REAR_DELT">{BACK_EXERCISE_NAMES.REAR_DELT}</MenuItem>
                <MenuItem value="LAT_PULLDOWN">{BACK_EXERCISE_NAMES.LAT_PULLDOWN}</MenuItem>
                <MenuItem value="STRAIGHT_ARM">{BACK_EXERCISE_NAMES.STRAIGHT_ARM}</MenuItem>
              </Select>
            </FormControl>
          )}

          <Box sx={{ flex: 1 }} />

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
        </Stack>

        {/* 권장 카메라 모드 안내 */}
        {!isActive && !isRecommendedMode && (
          <Alert severity="info" sx={{ mt: 1, py: 0.5 }}>
            {exerciseCategory === 'BACK'
              ? `${BACK_EXERCISE_NAMES[backExerciseType]}은(는) ${
                  recommendedCameraMode === 'SIDE' ? '측면' : '정면'
                } 카메라를 권장합니다`
              : '스쿼트는 정면 카메라를 권장합니다'}
          </Alert>
        )}
      </Box>

      {/* 카메라 피드 + 오버레이 */}
      <Box
        ref={videoContainerRef}
        sx={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}
      >
        <CameraFeed
          ref={videoRef}
          cameraStatus={cameraStatus}
          error={cameraError || poseError}
          width="100%"
          height="100%"
          mirrored={cameraMode === 'FRONT'}
        />

        {/* 포즈 오버레이 */}
        {isActive && landmarks && (
          <PoseOverlay
            landmarks={landmarks}
            phase={exerciseCategory === 'SQUAT' ? currentPhase : pullingPhase}
            exerciseCategory={exerciseCategory}
            containerRef={videoContainerRef}
            videoRef={videoRef}
            mirrored={cameraMode === 'FRONT'}
          />
        )}

        {/* FPS 표시 (좌상단) */}
        {isActive && (
          <Chip
            label={`${fps} FPS`}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              bgcolor: 'rgba(0,0,0,0.6)',
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        )}

        {/* 카메라 전환 버튼 (우상단) */}
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
          exerciseCategory={exerciseCategory}
          phase={exerciseCategory === 'SQUAT' ? currentPhase : pullingPhase}
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
          calibration={exerciseCategory === 'SQUAT' ? calibration : undefined}
          backCalibration={exerciseCategory === 'BACK' ? backCalibration : undefined}
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
            {exerciseCategory === 'SQUAT'
              ? cameraMode === 'FRONT'
                ? '정면 모드: 무릎 방향, 좌우 균형을 분석합니다'
                : '측면 모드: 무릎 위치, 상체 기울기를 분석합니다'
              : cameraMode === 'SIDE'
              ? '측면 모드: 팔꿈치 궤적, 상체 반동을 분석합니다'
              : '정면 모드: 좌우 대칭, 팔 경로를 분석합니다'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default PoseAnalysisView;
