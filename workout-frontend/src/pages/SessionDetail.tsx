import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Grid, Chip, IconButton, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { workoutService } from '../services/workoutService';
import type { WorkoutSession, ExerciseRecord } from '../types';
import { format } from 'date-fns';

const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      if (!id) return;
      try {
        const data = await workoutService.getSessionById(Number(id));
        setSession(data);
      } catch (error) {
        console.error('Failed to fetch session', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (!session) return <Box sx={{ p: 4 }}><Typography>세션을 찾을 수 없습니다</Typography></Box>;

  const sortedRecords = [...(session.exercisesPerformed || [])].sort(
    (a: ExerciseRecord, b: ExerciseRecord) => (a.id ?? 0) - (b.id ?? 0)
  );

  return (
    <Box>
      {/* Header with back button */}
      <Box sx={{ mb: 4 }}>
        <IconButton onClick={() => navigate('/history')} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          {format(new Date(session.date), 'yyyy년 M월 d일')}
        </Typography>
      </Box>

      {/* Session overview */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: '16px' }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 4 }}>
            <Typography variant="body2" color="text.secondary">운동 시간</Typography>
            <Typography variant="h5" fontWeight="bold">{session.duration}분</Typography>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Typography variant="body2" color="text.secondary">운동 종목</Typography>
            <Typography variant="h5" fontWeight="bold">
              {session.exercisesPerformed?.length || 0}개
            </Typography>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Typography variant="body2" color="text.secondary">메모</Typography>
            <Typography variant="body1">{session.notes || '-'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Exercise details */}
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>운동 상세</Typography>
      {sortedRecords.map((record) => (
        <Paper key={record.id} sx={{ p: 3, mb: 2, borderRadius: '16px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">{record.exerciseName}</Typography>
            <Chip label={`세트 ${record.setNumber}`} size="small" />
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 4 }}>
              <Typography variant="body2" color="text.secondary">횟수</Typography>
              <Typography variant="h6">{record.reps}</Typography>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Typography variant="body2" color="text.secondary">무게</Typography>
              <Typography variant="h6">{record.weight || 0}kg</Typography>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Typography variant="body2" color="text.secondary">RPE</Typography>
              <Typography variant="h6">{record.rpe ?? '-'}</Typography>
            </Grid>
          </Grid>
        </Paper>
      ))}
    </Box>
  );
};

export default SessionDetail;
