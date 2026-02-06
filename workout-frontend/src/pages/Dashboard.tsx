import { useEffect, useState, useMemo, lazy, Suspense, memo, useCallback } from 'react';
import { Grid, Typography, Box, Button, Stack, useTheme, useMediaQuery, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';
import { workoutService } from '../services/workoutService';
import { dietService } from '../services/dietService';
import { useAuthStore } from '../store/authStore';
import type { WorkoutDashboardData, DietDashboardData } from '../types';
import { format } from 'date-fns';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { useNavigate } from 'react-router-dom';
import TossCard from '../components/TossCard';
import ActivityHeatmap from '../components/ActivityHeatmap';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import BottomSheet from '../components/BottomSheet';
import { parseISO } from 'date-fns';
import TodaySummaryCopy from '../components/TodaySummaryCopy';
import EmptyState from "../components/EmptyState.tsx";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";

const DashboardVolumeChart = lazy(() => import('../components/DashboardVolumeChart'));

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 300,
    }
  }
};

const greetingVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    }
  }
};

// Mesh Gradient Background Component
const MeshGradientBackground = ({ isDark }: { isDark: boolean }) => (
  <Box
    sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '600px',
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: -1,
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        top: -150,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle, rgba(49, 130, 246, 0.15) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(49, 130, 246, 0.12) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        top: 100,
        left: -150,
        width: 350,
        height: 350,
        borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        top: 300,
        right: 50,
        width: 250,
        height: 250,
        borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle, rgba(34, 211, 238, 0.08) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(34, 211, 238, 0.06) 0%, transparent 70%)',
        filter: 'blur(50px)',
      }}
    />
  </Box>
);

// Custom Hook for Dashboard Data
const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState<WorkoutDashboardData | null>(null);
  const [dietSummary, setDietSummary] = useState<DietDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const [workoutData, dietData] = await Promise.all([
          workoutService.getWorkoutDashboard(tz),
          dietService.getTodayDietSummary(tz)
        ]);

        setDashboardData(workoutData);
        setDietSummary(dietData);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침입니다';
    if (hour < 18) return '좋은 오후입니다';
    return '좋은 저녁입니다';
  }, []);

  const selectedSessions = useMemo(() => {
    if (!selectedDate || !dashboardData) return [];
    return dashboardData.recentSessions.filter(s => s.date.startsWith(selectedDate));
  }, [selectedDate, dashboardData]);

  const selectedVolume = useMemo(() => {
    return selectedSessions.reduce((total, session) =>
      total + session.exercisesPerformed.reduce((sum, e) =>
        sum + (e.weight || 0) * (e.reps || 0), 0), 0);
  }, [selectedSessions]);

  return {
    dashboardData,
    dietSummary,
    loading,
    greeting,
    selectedDate,
    setSelectedDate,
    selectedSessions,
    selectedVolume,
  };
};

// Sub-Components

interface DashboardHeaderProps {
  greeting: string;
  username: string | undefined;
  isMobile: boolean;
  onLogWorkout: () => void;
}

const DashboardHeader = memo<DashboardHeaderProps>(({ greeting, username, isMobile, onLogWorkout }) => (
  <motion.div variants={greetingVariants}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
      <Box>
        <Typography
          variant="h1"
          sx={{
            fontSize: isMobile ? '26px' : '34px',
            fontWeight: 700,
            mb: 1,
            color: 'text.primary',
            letterSpacing: '-0.02em',
          }}
        >
          {greeting},<br />
          {username}님
        </Typography>
        <Typography variant="body1" color="text.secondary">
          오늘도 건강한 하루 보내세요!
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TodaySummaryCopy />
        {!isMobile && (
          <Button
            variant="contained"
            disableElevation
            startIcon={<AddCircleOutlineIcon />}
            onClick={onLogWorkout}
            sx={{
              bgcolor: 'primary.main',
              borderRadius: '16px',
              py: 1.5,
              px: 3,
              fontSize: '16px',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 8px 24px rgba(49, 130, 246, 0.25)',
              '&:hover': {
                bgcolor: 'primary.dark',
                boxShadow: '0 12px 28px rgba(49, 130, 246, 0.35)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            운동 기록하기
          </Button>
        )}
      </Box>
    </Box>
  </motion.div>
));
DashboardHeader.displayName = 'DashboardHeader';

interface VolumeSectionProps {
  totalVolume: number;
  volumeChartData: Array<{ date: string; volume: number }>;
}

const VolumeSection = memo<VolumeSectionProps>(({ totalVolume, volumeChartData }) => (
  <Grid size={{ xs: 12, md: 7, lg: 8 }} sx={{ display: 'flex', flexDirection: 'column' }}>
    <motion.div variants={itemVariants}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" fontWeight="600" color="text.secondary" gutterBottom>
          총 볼륨 (Accumulated)
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h2" fontWeight="700" color="text.primary" sx={{ fontSize: '32px', letterSpacing: '-0.02em' }}>
            {totalVolume.toLocaleString()}
          </Typography>
          <Typography variant="h6" fontWeight="600" color="primary.main">
            kg
          </Typography>
        </Box>
      </Box>
    </motion.div>
    <motion.div variants={itemVariants} style={{ flex: 1 }}>
      <TossCard sx={{ height: '320px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, minHeight: 0, width: '100%', pt: 1 }}>
          {volumeChartData.length > 0 ? (
            <Suspense fallback={<Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 3 }} />}>
              <DashboardVolumeChart data={volumeChartData} />
            </Suspense>
          ) : (
            <EmptyState
              icon={<ShowChartIcon />}
              title="아직 데이터가 없어요"
              description="운동을 기록하면 변화를 그래프로 확인할 수 있어요"
              height="100%"
            />
          )}
        </Box>
      </TossCard>
    </motion.div>
  </Grid>
));
VolumeSection.displayName = 'VolumeSection';

interface DietSectionProps {
  dietSummary: DietDashboardData;
  isDark: boolean;
  onNavigate: () => void;
}

const DietSection = memo<DietSectionProps>(({ dietSummary, isDark, onNavigate }) => (
  <motion.div variants={itemVariants} style={{ flex: 1, display: 'flex' }}>
    <TossCard onClick={onNavigate} sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            p: 1,
            borderRadius: '14px',
            bgcolor: isDark ? 'rgba(49, 130, 246, 0.15)' : 'rgba(49, 130, 246, 0.1)',
            color: '#3182F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <RestaurantIcon fontSize="small" />
          </Box>
          <Typography variant="h6" fontWeight="700" color="text.primary">
            오늘의 식단
          </Typography>
        </Box>
        <ArrowForwardIosIcon sx={{ color: 'text.disabled', fontSize: '16px' }} />
      </Box>

      {dietSummary.hasData ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h3" fontWeight="700" color="text.primary" sx={{ fontSize: '28px', letterSpacing: '-0.02em' }}>
              {dietSummary.calories.toLocaleString()}
              <Typography component="span" variant="h6" color="text.secondary" sx={{ ml: 0.5 }}>kcal</Typography>
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {[
              { label: '탄수화물', val: dietSummary.carbs, color: '#3182F6' },
              { label: '단백질', val: dietSummary.protein, color: '#F04452' },
              { label: '지방', val: dietSummary.fat, color: '#FFB800' }
            ].map((item) => (
              <Grid size={{ xs: 4 }} key={item.label}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    {item.label}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="700" color={item.color}>
                    {item.val}g
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        <Box sx={{ py: 2, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            기록된 식단이 없어요
          </Typography>
          <Button
            variant="text"
            color="primary"
            sx={{ fontWeight: 600 }}
          >
            지금 기록하기
          </Button>
        </Box>
      )}
    </TossCard>
  </motion.div>
));
DietSection.displayName = 'DietSection';

interface StatsGridProps {
  totalWorkouts: number;
  monthlyWorkouts: number;
}

const StatsGrid = memo<StatsGridProps>(({ totalWorkouts, monthlyWorkouts }) => (
  <motion.div variants={itemVariants}>
    <Grid container spacing={2}>
      <Grid size={{ xs: 6 }}>
        <TossCard>
          <Typography variant="body2" color="text.secondary" fontWeight="600" mb={1}>총 운동</Typography>
          <Typography variant="h4" fontWeight="700" color="text.primary" sx={{ letterSpacing: '-0.02em' }}>
            {totalWorkouts}
            <Typography component="span" variant="body1" color="text.secondary" ml={0.5}>회</Typography>
          </Typography>
        </TossCard>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TossCard>
          <Typography variant="body2" color="text.secondary" fontWeight="600" mb={1}>이번 달</Typography>
          <Typography variant="h4" fontWeight="700" color="text.primary" sx={{ letterSpacing: '-0.02em' }}>
            {monthlyWorkouts}
            <Typography component="span" variant="body1" color="text.secondary" ml={0.5}>회</Typography>
          </Typography>
        </TossCard>
      </Grid>
    </Grid>
  </motion.div>
));
StatsGrid.displayName = 'StatsGrid';

interface RecentActivityListProps {
  sessions: WorkoutDashboardData['recentSessions'];
  isDark: boolean;
  onNavigate: (path: string) => void;
  onLogWorkout: () => void;
}

const RecentActivityList = memo<RecentActivityListProps>(({ sessions, isDark, onNavigate, onLogWorkout }) => (
  <motion.div variants={itemVariants}>
    <Box sx={{ mt: 5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="700" color="text.primary">최근 활동</Typography>
        <Button
          onClick={() => onNavigate('/history')}
          sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.9rem' }}
        >
          전체보기
        </Button>
      </Box>

      {sessions.length === 0 ? (
        <EmptyState
          icon={<FitnessCenterIcon />}
          title="아직 기록된 운동이 없어요"
          description="오늘 첫 운동을 시작하고 더 건강한 나를 만들어보세요!"
          action={
            <Button
              variant="contained"
              disableElevation
              onClick={onLogWorkout}
              sx={{
                borderRadius: '16px',
                bgcolor: 'primary.main',
                px: 4,
                py: 1.5,
                fontSize: '16px',
                fontWeight: 700,
                boxShadow: '0 8px 24px rgba(49, 130, 246, 0.25)',
                '&:hover': {
                  boxShadow: '0 12px 28px rgba(49, 130, 246, 0.35)',
                }
              }}
            >
              첫 운동 시작하기
            </Button>
          }
        />
      ) : (
        <Stack spacing={2}>
          {sessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <TossCard
                onClick={() => onNavigate(`/sessions/${session.id}`)}
                sx={{
                  p: 2.5,
                  // content-visibility로 화면 밖 항목 렌더링 최적화
                  contentVisibility: 'auto',
                  containIntrinsicSize: '0 80px',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 50,
                      height: 50,
                      borderRadius: '18px',
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f2f4f6',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'text.secondary'
                    }}>
                      <Typography variant="caption" sx={{ fontSize: '11px', fontWeight: 600, lineHeight: 1.2 }}>
                        {format(new Date(session.date), 'MMM')}
                      </Typography>
                      <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 700, lineHeight: 1, color: 'text.primary' }}>
                        {format(new Date(session.date), 'd')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="600" color="text.primary" sx={{ mb: 0.5 }}>
                        {session.notes || "운동 세션"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Set(session.exercisesPerformed.map(e => e.exerciseId)).size}개 종목
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ArrowForwardIosIcon sx={{ color: 'text.disabled', fontSize: '18px' }} />
                  </Box>
                </Box>
              </TossCard>
            </motion.div>
          ))}
        </Stack>
      )}
    </Box>
  </motion.div>
));
RecentActivityList.displayName = 'RecentActivityList';

// Main Dashboard Component

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = useMemo(() => theme.palette.mode === 'dark', [theme.palette.mode]);

  const {
    dashboardData,
    dietSummary,
    loading,
    greeting,
    selectedDate,
    setSelectedDate,
    selectedSessions,
    selectedVolume,
  } = useDashboardData();

  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  // 콜백 메모이제이션으로 불필요한 리렌더 방지
  const handleHeatmapClick = useCallback((date: string) => {
    setSelectedDate(date);
    setBottomSheetOpen(true);
  }, [setSelectedDate]);

  const handleLogWorkout = useCallback(() => navigate('/log-workout'), [navigate]);
  const handleNavigate = useCallback((path: string) => navigate(path), [navigate]);
  useCallback((session: WorkoutDashboardData['recentSessions'][0]) => {
    navigate('/log-workout', { state: { previousSession: session } });
  }, [navigate]);
  if (loading || !dashboardData || !dietSummary) {
    return <DashboardSkeleton />;
  }

  return (
    <Box sx={{ pb: 8, maxWidth: '1200px', mx: 'auto', position: 'relative' }}>
      <MeshGradientBackground isDark={isDark} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <DashboardHeader
          greeting={greeting}
          username={user?.username}
          isMobile={isMobile}
          onLogWorkout={handleLogWorkout}
        />

        <motion.div variants={itemVariants}>
          <Box sx={{ mb: 4 }}>
            <TossCard>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="700" color="text.primary">
                  운동 활동
                </Typography>
              </Box>
              <Box sx={{ minHeight: '160px' }}>
                <ActivityHeatmap
                  startDate={dashboardData.heatmapStartDate}
                  levels={dashboardData.heatmapLevels}
                  onClick={handleHeatmapClick}
                />
              </Box>
            </TossCard>
          </Box>
        </motion.div>

        <Grid container spacing={3} alignItems="stretch">
          <VolumeSection
            totalVolume={dashboardData.totalVolume}
            volumeChartData={dashboardData.volumeChartData}
          />

          <Grid size={{ xs: 12, md: 5, lg: 4 }} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Stack spacing={3} sx={{ height: '100%', flex: 1 }}>
              <DietSection
                dietSummary={dietSummary}
                isDark={isDark}
                onNavigate={() => handleNavigate('/diet-log')}
              />
              <StatsGrid
                totalWorkouts={dashboardData.totalWorkouts}
                monthlyWorkouts={dashboardData.monthlyWorkouts}
              />
            </Stack>
          </Grid>
        </Grid>

        <RecentActivityList
          sessions={dashboardData.recentSessions}
          isDark={isDark}
          onNavigate={handleNavigate}
          onLogWorkout={handleLogWorkout}
        />

        {isMobile && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' as const, damping: 15, stiffness: 300 }}
          >
            <Button
              variant="contained"
              sx={{
                position: 'fixed',
                bottom: 100,
                right: 24,
                borderRadius: '50px',
                py: 2,
                px: 4,
                bgcolor: 'primary.main',
                boxShadow: '0 8px 24px rgba(49, 130, 246, 0.4)',
                zIndex: 100,
                fontWeight: 700,
                '&:hover': {
                  boxShadow: '0 12px 32px rgba(49, 130, 246, 0.5)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s ease',
              }}
              startIcon={<AddCircleOutlineIcon />}
              onClick={handleLogWorkout}
            >
              기록
            </Button>
          </motion.div>
        )}
      </motion.div>

      <BottomSheet
        open={bottomSheetOpen}
        onClose={() => setBottomSheetOpen(false)}
        title={selectedDate ? format(parseISO(selectedDate), 'yyyy년 M월 d일') : ''}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>총 볼륨</Typography>
            <Typography variant="h5" fontWeight="700">
              {selectedVolume > 0 ? `${selectedVolume.toLocaleString()} kg` : '기록 없음'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom mb={2}>
              운동 세션 ({selectedSessions.length})
            </Typography>
            {selectedSessions.length > 0 ? (
              <Stack spacing={2}>
                {selectedSessions.map(session => (
                  <TossCard
                    key={session.id}
                    onClick={() => handleNavigate(`/sessions/${session.id}`)}
                    sx={{ p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9' }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="600">
                          {session.notes || '운동 세션'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Set(session.exercisesPerformed.map(e => e.exerciseId)).size}개 종목
                        </Typography>
                      </Box>
                      <ArrowForwardIosIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    </Box>
                  </TossCard>
                ))}
              </Stack>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f5f5f5', borderRadius: 4 }}>
                <Typography variant="body2" color="text.secondary">이 날짜의 상세 기록이 없어요.</Typography>
              </Box>
            )}
          </Box>
        </Stack>
      </BottomSheet>
    </Box>
  );
};

export default Dashboard;
