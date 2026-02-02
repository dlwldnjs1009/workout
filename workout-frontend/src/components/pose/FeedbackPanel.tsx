import { Box, Typography, Chip, LinearProgress, Stack, Paper } from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  FitnessCenter,
  Speed,
  Straighten,
} from '@mui/icons-material';
import type { SquatPhase, LandmarkConfidence, SquatCalibration } from '../../types';

interface FeedbackPanelProps {
  phase: SquatPhase;
  kneeAngle: number;
  repCount: number;
  formScore: number;
  feedback: string[];
  fps: number;
  confidence: LandmarkConfidence;
  calibration: SquatCalibration;
  isDetecting: boolean;
}

const phaseLabels: Record<SquatPhase, string> = {
  STANDING: '서 있음',
  DESCENDING: '내려가는 중',
  BOTTOM: '최저점',
  ASCENDING: '올라가는 중',
};

const phaseColors: Record<SquatPhase, 'success' | 'warning' | 'info' | 'secondary'> = {
  STANDING: 'success',
  DESCENDING: 'warning',
  BOTTOM: 'info',
  ASCENDING: 'secondary',
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
 * FeedbackPanel: 실시간 스쿼트 분석 피드백을 표시하는 컴포넌트
 * 
 * - 현재 phase 및 무릎 각도 표시
 * - 반복 횟수 및 평균 폼 점수
 * - 실시간 피드백 메시지
 * - 캘리브레이션 상태
 * - FPS 및 신뢰도 표시
 */
export function FeedbackPanel({
  phase,
  kneeAngle,
  repCount,
  formScore,
  feedback,
  fps,
  confidence,
  calibration,
  isDetecting,
}: FeedbackPanelProps) {
  const ConfidenceIcon = confidenceConfig[confidence].icon;

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
            label={phaseLabels[phase]}
            color={phaseColors[phase]}
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

          {/* 무릎 각도 */}
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
            <Typography variant="h4" fontWeight="bold">
              {Math.round(kneeAngle)}°
            </Typography>
            <Typography variant="caption" color="text.secondary">
              무릎 각도
            </Typography>
          </Paper>
        </Box>

        {/* 깊이 진행바 */}
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
        {!calibration.isCalibrated && isDetecting && (
          <Box
            sx={{
              p: 1,
              bgcolor: 'info.dark',
              borderRadius: 1,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="white">
              캘리브레이션 중... 정확한 분석을 위해 3-5회 스쿼트를 수행해주세요
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

export default FeedbackPanel;
