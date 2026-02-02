import { Box, Typography, Chip, Stack } from '@mui/material';
import { CheckCircle, Warning, Error as ErrorIcon } from '@mui/icons-material';
import type {
  SquatPhase,
  PullingPhase,
  LandmarkConfidence,
  SquatCalibration,
  BackCalibration,
  ExerciseCategory,
} from '../../types';

interface FeedbackPanelProps {
  exerciseCategory: ExerciseCategory;
  phase: SquatPhase | PullingPhase;
  kneeAngle: number;
  repCount: number;
  formScore: number;
  feedback: string[];
  fps: number;
  confidence: LandmarkConfidence;
  calibration?: SquatCalibration;
  backCalibration?: BackCalibration;
  isDetecting: boolean;
}

const squatPhaseLabels: Record<SquatPhase, string> = {
  STANDING: '서 있음',
  DESCENDING: '내려가는 중',
  BOTTOM: '최저점',
  ASCENDING: '올라가는 중',
};

const pullingPhaseLabels: Record<PullingPhase, string> = {
  EXTENDED: '시작 위치',
  PULLING: '당기는 중',
  CONTRACTED: '최대 수축',
  RETURNING: '복귀 중',
};

const squatPhaseColors: Record<SquatPhase, 'success' | 'warning' | 'info' | 'secondary'> = {
  STANDING: 'success',
  DESCENDING: 'warning',
  BOTTOM: 'info',
  ASCENDING: 'secondary',
};

const pullingPhaseColors: Record<PullingPhase, 'success' | 'warning' | 'info' | 'secondary'> = {
  EXTENDED: 'success',
  PULLING: 'warning',
  CONTRACTED: 'info',
  RETURNING: 'secondary',
};

const confidenceConfig: Record<
  LandmarkConfidence,
  { color: 'success' | 'warning' | 'error'; icon: typeof CheckCircle }
> = {
  HIGH: { color: 'success', icon: CheckCircle },
  MEDIUM: { color: 'warning', icon: Warning },
  LOW: { color: 'error', icon: ErrorIcon },
};

/**
 * FeedbackPanel: 실시간 운동 분석 피드백을 표시하는 컴포넌트
 *
 * - 현재 phase 표시 (스쿼트/등운동 공용)
 * - 반복 횟수 및 폼 점수
 * - 실시간 피드백 메시지
 * - 캘리브레이션 상태
 * - FPS 및 신뢰도 표시
 */
export function FeedbackPanel({
  exerciseCategory,
  phase,
  kneeAngle,
  repCount,
  formScore,
  feedback,
  fps,
  confidence,
  calibration,
  backCalibration,
  isDetecting,
}: FeedbackPanelProps) {
  // fps는 신뢰도 아이콘에서 사용
  void fps;
  const ConfidenceIcon = confidenceConfig[confidence].icon;

  // 운동 카테고리에 따른 phase 라벨/색상
  const phaseLabel =
    exerciseCategory === 'SQUAT'
      ? squatPhaseLabels[phase as SquatPhase]
      : pullingPhaseLabels[phase as PullingPhase];

  const phaseColor =
    exerciseCategory === 'SQUAT'
      ? squatPhaseColors[phase as SquatPhase]
      : pullingPhaseColors[phase as PullingPhase];

  // 캘리브레이션 상태
  const isCalibrated =
    exerciseCategory === 'SQUAT'
      ? calibration?.isCalibrated ?? false
      : backCalibration?.isCalibrated ?? false;

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Stack spacing={1}>
        {/* 상태 표시 바 + 메인 지표 (모바일에서는 한 줄로) */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {/* Phase 칩 */}
          <Chip
            label={phaseLabel}
            color={phaseColor}
            size="small"
            sx={{ fontWeight: 'bold' }}
          />

          {/* 메인 지표들 - 한 줄로 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* 반복 횟수 */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#90caf9' }}>
                {repCount}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                회
              </Typography>
            </Box>

            {/* 폼 점수 */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ color: formScore >= 80 ? '#81c784' : formScore >= 60 ? '#ffb74d' : '#e57373' }}
              >
                {formScore > 0 ? formScore : '-'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                점
              </Typography>
            </Box>

            {/* 무릎 각도 (스쿼트만) */}
            {exerciseCategory === 'SQUAT' && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#4fc3f7' }}>
                  {Math.round(kneeAngle)}°
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  각도
                </Typography>
              </Box>
            )}
          </Box>

          {/* 신뢰도 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ConfidenceIcon
              fontSize="small"
              color={confidenceConfig[confidence].color}
            />
          </Box>
        </Box>

        {/* 피드백 메시지 */}
        {feedback.length > 0 && (
          <Box
            sx={{
              p: 1,
              bgcolor: feedback[0]?.includes('좋은') ? 'success.dark' : 'warning.dark',
              borderRadius: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'white',
              }}
            >
              {feedback[0]?.includes('좋은') ? (
                <CheckCircle fontSize="small" />
              ) : (
                <Warning fontSize="small" />
              )}
              {feedback[0]}
            </Typography>
          </Box>
        )}

        {/* 캘리브레이션 상태 */}
        {!isCalibrated && isDetecting && (
          <Typography variant="caption" sx={{ color: '#4fc3f7' }} textAlign="center">
            캘리브레이션 중... {exerciseCategory === 'SQUAT' ? '3-5회 스쿼트' : '3회 반복'} 수행
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

export default FeedbackPanel;
