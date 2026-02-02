import { Box, Typography, Chip, LinearProgress, Stack, Paper } from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  FitnessCenter,
  Speed,
  Straighten,
} from '@mui/icons-material';
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
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* 상태 표시 바 */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
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

          {/* 신뢰도 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ConfidenceIcon
              fontSize="small"
              color={confidenceConfig[confidence].color}
            />
            <Typography variant="caption" color="text.secondary">
              {fps} FPS
            </Typography>
          </Box>
        </Box>

        {/* 메인 지표 */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2,
          }}
        >
          {/* 반복 횟수 */}
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              textAlign: 'center',
              bgcolor: 'background.default',
              borderRadius: 2,
            }}
          >
            <FitnessCenter color="primary" />
            <Typography variant="h4" fontWeight="bold">
              {repCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              반복
            </Typography>
          </Paper>

          {/* 폼 점수 */}
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              textAlign: 'center',
              bgcolor: 'background.default',
              borderRadius: 2,
            }}
          >
            <Speed
              color={formScore >= 80 ? 'success' : formScore >= 60 ? 'warning' : 'error'}
            />
            <Typography variant="h4" fontWeight="bold">
              {formScore > 0 ? formScore : '-'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              폼 점수
            </Typography>
          </Paper>

          {/* 무릎 각도 (스쿼트만) 또는 진행 상태 (등운동) */}
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              textAlign: 'center',
              bgcolor: 'background.default',
              borderRadius: 2,
            }}
          >
            <Straighten color="info" />
            {exerciseCategory === 'SQUAT' ? (
              <>
                <Typography variant="h4" fontWeight="bold">
                  {Math.round(kneeAngle)}°
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  무릎 각도
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h4" fontWeight="bold">
                  {isCalibrated ? '준비됨' : '...'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  캘리브레이션
                </Typography>
              </>
            )}
          </Paper>
        </Box>

        {/* 깊이 진행바 (스쿼트만 표시) */}
        {exerciseCategory === 'SQUAT' && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                깊이
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {kneeAngle < 90 ? '딥' : kneeAngle < 110 ? '평행' : '얕음'}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, Math.min(100, ((180 - kneeAngle) / 90) * 100))}
              sx={{
                height: 8,
                borderRadius: 1,
                bgcolor: 'grey.800',
                '& .MuiLinearProgress-bar': {
                  bgcolor:
                    kneeAngle < 90
                      ? 'success.main'
                      : kneeAngle < 110
                      ? 'info.main'
                      : 'warning.main',
                },
              }}
            />
          </Box>
        )}

        {/* 피드백 메시지 */}
        {feedback.length > 0 && (
          <Box
            sx={{
              p: 1.5,
              bgcolor: feedback[0]?.includes('좋은') ? 'success.dark' : 'warning.dark',
              borderRadius: 2,
            }}
          >
            {feedback.map((msg, idx) => (
              <Typography
                key={idx}
                variant="body2"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'white',
                }}
              >
                {msg.includes('좋은') ? (
                  <CheckCircle fontSize="small" />
                ) : (
                  <Warning fontSize="small" />
                )}
                {msg}
              </Typography>
            ))}
          </Box>
        )}

        {/* 캘리브레이션 상태 */}
        {!isCalibrated && isDetecting && (
          <Box
            sx={{
              p: 1,
              bgcolor: 'info.dark',
              borderRadius: 1,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="white">
              {exerciseCategory === 'SQUAT'
                ? '캘리브레이션 중... 정확한 분석을 위해 3-5회 스쿼트를 수행해주세요'
                : '캘리브레이션 중... 정확한 분석을 위해 3회 반복을 수행해주세요'}
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

export default FeedbackPanel;
