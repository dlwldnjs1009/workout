import {useEffect, useState, useMemo, useCallback, lazy, Suspense} from 'react';
import {Box, CircularProgress, Grid, Stack, Typography, useTheme, Skeleton} from '@mui/material';
import type {WorkoutSession} from '../types';
import {format, startOfWeek} from 'date-fns';
import TossCard from '../components/TossCard';
import EmptyState from '../components/EmptyState';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import HistoryIcon from '@mui/icons-material/History';
import { useWorkoutStore } from '../store/workoutStore';

const WeeklyWorkoutsChart = lazy(() => import('../components/WeeklyWorkoutsChart'));
const ProgressVolumeChart = lazy(() => import('../components/ProgressVolumeChart'));

const Progress = () => {
    const sessions = useWorkoutStore((state) => state.sessions);
    const fetchSessions = useWorkoutStore((state) => state.fetchSessions);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();

    useEffect(() => {
        const loadSessions = async () => {
            try {
                await fetchSessions();
            } catch (error) {
                console.error('Failed to fetch sessions', error);
            } finally {
                setLoading(false);
            }
        };

        loadSessions();
    }, [fetchSessions]);

    // useMemo로 세션 볼륨 계산 캐싱
    const calculateSessionVolume = useCallback((session: WorkoutSession) => {
        return session.exercisesPerformed.reduce((acc, record) => {
            return acc + (record.weight || 0) * record.reps;
        }, 0);
    }, []);

    // 주별 운동 횟수 데이터 메모이제이션
    const chartData = useMemo(() => {
        const workoutsPerWeek = sessions.reduce((acc: Record<string, number>, session) => {
            const date = new Date(session.date);
            const weekStart = format(startOfWeek(date), 'MMM d');
            acc[weekStart] = (acc[weekStart] || 0) + 1;
            return acc;
        }, {});

        return Object.keys(workoutsPerWeek).map(week => ({
            name: week,
            workouts: workoutsPerWeek[week]
        }));
    }, [sessions]);

    // 볼륨 데이터 메모이제이션
    const volumeData = useMemo(() => {
        return [...sessions]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-10)
            .map(session => ({
                date: format(new Date(session.date), 'MM/dd'),
                volume: calculateSessionVolume(session)
            }));
    }, [sessions, calculateSessionVolume]);

    // 통계 값 메모이제이션
    const { totalWorkouts, totalVolume } = useMemo(() => ({
        totalWorkouts: sessions.length,
        totalVolume: sessions.reduce((acc, session) => acc + calculateSessionVolume(session), 0)
    }), [sessions, calculateSessionVolume]);

    if (loading) return <Box sx={{display: 'flex', justifyContent: 'center', mt: 4}}><CircularProgress/></Box>;

    return (
        <Box sx={{pb: 8}}>
            <Box sx={{mb: 6}}>
                <Typography variant="h4" fontWeight="800" gutterBottom sx={{color: 'text.primary'}}>
                    진행상황
                </Typography>
                <Typography variant="body1" sx={{color: 'text.secondary'}}>
                    피트니스 포트폴리오
                </Typography>
            </Box>

            <Grid container spacing={4} sx={{mb: 6}}>
                <Grid size={{xs: 12, md: 6}}>
                    <Box sx={{mb: 2}}>
                        <Typography variant="body2" fontWeight="600" color="text.secondary" gutterBottom>
                            총 운동 횟수
                        </Typography>
                        <Box sx={{display: 'flex', alignItems: 'baseline', gap: 1}}>
                            <Typography variant="h2" fontWeight="700" color="text.primary">
                                {totalWorkouts}
                            </Typography>
                            <Typography variant="h6" fontWeight="600" color="#ef4444">
                                ▲ {chartData.length > 0 ? chartData[chartData.length - 1].workouts : 0} this week
                            </Typography>
                        </Box>
                    </Box>
                    <TossCard sx={{height: '320px', p: 3}}>
                        {chartData.length > 0 ? (
                            <Suspense fallback={<Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 3 }} />}>
                                <WeeklyWorkoutsChart data={chartData} />
                            </Suspense>
                        ) : (
                            <EmptyState
                                icon={<BarChartIcon />}
                                title="데이터가 부족해요"
                                description="운동을 기록하면 주간 통계를 볼 수 있어요"
                                height="100%"
                            />
                        )}
                    </TossCard>
                </Grid>

                <Grid size={{xs: 12, md: 6}}>
                    <Box sx={{mb: 2}}>
                        <Typography variant="body2" fontWeight="600" color="text.secondary" gutterBottom>
                            총 볼륨 (KG)
                        </Typography>
                        <Box sx={{display: 'flex', alignItems: 'baseline', gap: 1}}>
                            <Typography variant="h2" fontWeight="700" color="text.primary">
                                {totalVolume.toLocaleString()}
                            </Typography>
                            <Typography variant="h6" fontWeight="600" color="#3182F6">
                                kg total
                            </Typography>
                        </Box>
                    </Box>
                    <TossCard sx={{height: '320px', p: 3}}>
                        {volumeData.length > 0 ? (
                            <Suspense fallback={<Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 3 }} />}>
                                <ProgressVolumeChart data={volumeData} />
                            </Suspense>
                        ) : (
                            <EmptyState
                                icon={<ShowChartIcon />}
                                title="아직 기록이 없어요"
                                description="운동을 꾸준히 하고 볼륨 성장을 확인해보세요"
                                height="100%"
                            />
                        )}
                    </TossCard>
                </Grid>
            </Grid>

            <Box>
                <TossCard>
                    <Typography variant="h5" fontWeight="700" gutterBottom sx={{mb: 3, color: 'text.primary'}}>
                        최근 운동 내역
                    </Typography>
                    {sessions.length > 0 ? (
                        <Stack spacing={0}>
                            {sessions.slice().reverse().slice(0, 5).map((session, index, arr) => (
                                <Box
                                    key={session.id}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        py: 2.5,
                                        borderBottom: index !== arr.length - 1 ? `1px solid ${theme.palette.divider}` : 'none'
                                    }}
                                >
                                    <Box>
                                        <Typography variant="body1" fontWeight="600" color="text.primary">
                                            {format(new Date(session.date), 'MMM d, yyyy')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {new Set(session.exercisesPerformed?.map(e => e.exerciseId) || []).size} 운동
                                            • {session.notes || '메모 없음'}
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" fontWeight="600" color="#3182F6">
                                        +{session.duration} 분
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    ) : (
                        <EmptyState
                            icon={<HistoryIcon />}
                            title="기록이 없습니다"
                            description="운동을 완료하면 여기에 내역이 표시됩니다"
                            height="200px"
                        />
                    )}
                </TossCard>
            </Box>
        </Box>
    );
};

export default Progress;
