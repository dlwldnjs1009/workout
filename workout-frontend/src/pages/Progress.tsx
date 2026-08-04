import {useEffect, useState, useMemo, useCallback, lazy, Suspense} from 'react';
import {Box, Button, CircularProgress, FormControl, Grid, InputLabel, MenuItem, Select, Stack, Typography, useTheme, Skeleton} from '@mui/material';
import type {ExerciseProgress, WorkoutSession} from '../types';
import {format, startOfWeek} from 'date-fns';
import { ko } from 'date-fns/locale';
import TossCard from '../components/TossCard';
import EmptyState from '../components/EmptyState';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import HistoryIcon from '@mui/icons-material/History';
import { useWorkoutStore } from '../store/workoutStore';
import { useToast } from '../components/ToastProvider';
import { workoutService } from '../services/workoutService';

const WeeklyWorkoutsChart = lazy(() => import('../components/WeeklyWorkoutsChart'));
const ProgressVolumeChart = lazy(() => import('../components/ProgressVolumeChart'));
const ExerciseOneRepMaxChart = lazy(() => import('../components/ExerciseOneRepMaxChart'));

const Progress = () => {
    const sessions = useWorkoutStore((state) => state.sessions);
    const fetchSessions = useWorkoutStore((state) => state.fetchSessions);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedExerciseId, setSelectedExerciseId] = useState<number | ''>('');
    const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress | null>(null);
    const [exerciseProgressLoading, setExerciseProgressLoading] = useState(false);
    const theme = useTheme();
    const toast = useToast();

    const loadSessions = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            await fetchSessions();
        } catch (error) {
            console.error('Failed to fetch sessions', error);
            setError(true);
            toast.error('운동 기록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }, [fetchSessions, toast]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

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
            const weekStart = format(startOfWeek(date), 'M월 d일', { locale: ko });
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
                date: format(new Date(session.date), 'M/d'),
                volume: calculateSessionVolume(session)
            }));
    }, [sessions, calculateSessionVolume]);

    // 통계 값 메모이제이션
    const { totalWorkouts, totalVolume } = useMemo(() => ({
        totalWorkouts: sessions.length,
        totalVolume: sessions.reduce((acc, session) => acc + calculateSessionVolume(session), 0)
    }), [sessions, calculateSessionVolume]);

    const exerciseOptions = useMemo(() => {
        const exercises = new Map<number, string>();
        sessions.forEach((session) => session.exercisesPerformed.forEach((record) => {
            exercises.set(record.exerciseId, record.exerciseName || `운동 #${record.exerciseId}`);
        }));
        return [...exercises.entries()].map(([id, name]) => ({ id, name }));
    }, [sessions]);

    useEffect(() => {
        if (selectedExerciseId === '' && exerciseOptions.length > 0) {
            setSelectedExerciseId(exerciseOptions[0].id);
        }
    }, [exerciseOptions, selectedExerciseId]);

    useEffect(() => {
        if (selectedExerciseId === '') {
            setExerciseProgress(null);
            return;
        }
        let cancelled = false;
        setExerciseProgressLoading(true);
        workoutService.getExerciseProgress(selectedExerciseId)
            .then((data) => {
                if (!cancelled) setExerciseProgress(data);
            })
            .catch((requestError) => {
                console.error('Failed to load exercise progress', requestError);
                if (!cancelled) {
                    setExerciseProgress(null);
                    toast.error('종목별 진척도를 불러오지 못했습니다.');
                }
            })
            .finally(() => {
                if (!cancelled) setExerciseProgressLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [selectedExerciseId, toast]);

    if (loading) return <Box sx={{display: 'flex', justifyContent: 'center', mt: 4}}><CircularProgress/></Box>;
    if (error) {
        return (
            <Box sx={{pb: 8}}>
                <EmptyState
                    icon={<HistoryIcon />}
                    title="운동 기록을 불러오지 못했어요"
                    description="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
                    action={<Button variant="contained" onClick={loadSessions}>다시 시도</Button>}
                    height="420px"
                />
            </Box>
        );
    }

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
                                이번 주 {chartData.length > 0 ? chartData[chartData.length - 1].workouts : 0}회
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
                            총 볼륨 (kg)
                        </Typography>
                        <Box sx={{display: 'flex', alignItems: 'baseline', gap: 1}}>
                            <Typography variant="h2" fontWeight="700" color="text.primary">
                                {totalVolume.toLocaleString()}
                            </Typography>
                            <Typography variant="h6" fontWeight="600" color="#3182F6">
                                kg 누적
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
                                            {format(new Date(session.date), 'yyyy년 M월 d일', { locale: ko })}
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

            <Box sx={{ mt: 6 }}>
                <TossCard sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Box>
                            <Typography variant="h5" fontWeight="700" color="text.primary">종목별 진척도</Typography>
                            <Typography variant="body2" color="text.secondary">추정 1RM과 다음 회차 중량을 확인하세요</Typography>
                        </Box>
                        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                            <InputLabel id="exercise-progress-select-label">운동 종목</InputLabel>
                            <Select
                                labelId="exercise-progress-select-label"
                                label="운동 종목"
                                value={selectedExerciseId}
                                onChange={(event) => setSelectedExerciseId(Number(event.target.value))}
                            >
                                {exerciseOptions.map((exercise) => (
                                    <MenuItem key={exercise.id} value={exercise.id}>{exercise.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {exerciseProgressLoading ? (
                        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
                    ) : exerciseProgress ? (
                        <>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid size={{ xs: 4 }}>
                                    <Typography variant="caption" color="text.secondary">최근 추정 1RM</Typography>
                                    <Typography variant="h6" fontWeight={800}>{exerciseProgress.currentEstimatedOneRepMax.toFixed(1)}kg</Typography>
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <Typography variant="caption" color="text.secondary">최고 추정 1RM</Typography>
                                    <Typography variant="h6" fontWeight={800} color="primary.main">{exerciseProgress.bestEstimatedOneRepMax.toFixed(1)}kg</Typography>
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <Typography variant="caption" color="text.secondary">최고 중량</Typography>
                                    <Typography variant="h6" fontWeight={800}>{exerciseProgress.bestWeight.toFixed(1)}kg</Typography>
                                </Grid>
                            </Grid>
                            <Box sx={{ mb: 3, p: 2, borderRadius: '16px', bgcolor: 'action.hover' }}>
                                <Typography variant="caption" fontWeight={800} color="primary.main">다음 회차 제안</Typography>
                                <Typography variant="body2" color="text.secondary">{exerciseProgress.suggestion.message}</Typography>
                            </Box>
                            {exerciseProgress.points.length > 0 ? (
                                <Box sx={{ height: 280 }}>
                                    <Suspense fallback={<Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 3 }} />}>
                                        <ExerciseOneRepMaxChart data={exerciseProgress.points} />
                                    </Suspense>
                                </Box>
                            ) : (
                                <EmptyState icon={<ShowChartIcon />} title="아직 종목 기록이 없어요" description="세트를 기록하면 추정 1RM 추세를 볼 수 있어요" height="260px" />
                            )}
                        </>
                    ) : (
                        <EmptyState icon={<ShowChartIcon />} title="종목을 선택해 주세요" description="운동 기록이 쌓이면 개인 기록과 추세를 보여드려요" height="260px" />
                    )}
                </TossCard>
            </Box>
        </Box>
    );
};

export default Progress;
