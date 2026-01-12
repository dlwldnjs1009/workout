import { useEffect, useState } from 'react';
import { 
  Box, Typography, Button, Grid, CircularProgress, 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, MenuItem, FormControl, InputLabel, Select, Chip, OutlinedInput,
  Paper, IconButton, useTheme, useMediaQuery, Stack, Snackbar, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { workoutService } from '../services/workoutService';
import type { WorkoutRoutine } from '../types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useWorkoutStore } from '../store/workoutStore';
import { useWorkoutSessionStore } from '../store/workoutSessionStore';
import ConfirmDialog from '../components/ConfirmDialog';

const routineSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  exerciseIds: z.array(z.number()).min(1, 'Select at least one exercise'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
});

type RoutineFormData = z.infer<typeof routineSchema>;

const Routines = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const exercises = useWorkoutStore((state) => state.exercises);
  const fetchExercises = useWorkoutStore((state) => state.fetchExercises);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  // Feedback & Deletion States
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [idToConfirm, setIdToConfirm] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false, message: '', severity: 'success'
  });

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<RoutineFormData>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      name: '',
      description: '',
      difficulty: 'BEGINNER',
      exerciseIds: [],
      duration: 30
    }
  });

  const { activeRoutineId, startRoutine } = useWorkoutSessionStore();

  const fetchData = async () => {
    try {
      const [routinesData] = await Promise.all([
        workoutService.getRoutines(),
        fetchExercises()
      ]);
      setRoutines(routinesData);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (data: RoutineFormData) => {
    try {
      await workoutService.createRoutine(data);
      setOpen(false);
      reset();
      fetchData();
    } catch (error) {
      console.error('Failed to create routine', error);
    }
  };

  const openDeleteConfirm = (id: number) => {
    setIdToConfirm(id);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!idToConfirm) return;
    const id = idToConfirm;
    try {
      setDeletingId(id);
      await workoutService.deleteRoutine(id);
      setRoutines(routines.filter(r => r.id !== id));
      setSnackbar({ open: true, message: '루틴 삭제 완료', severity: 'success' });
    } catch (error) {
      console.error('Failed to delete routine', error);
      setSnackbar({ open: true, message: '루틴 삭제 중 오류가 발생했습니다.', severity: 'error' });
    } finally {
      setDeletingId(null);
      setIdToConfirm(null);
    }
  };

  const handleStart = (routine: WorkoutRoutine) => {
    startRoutine(routine.id);
    navigate('/log-workout', { state: { routine } });
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ pb: 12, px: isMobile ? 1 : 0 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 1 }}>
        <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.02em', color: 'text.primary', fontSize: isMobile ? '1.75rem' : '2.125rem' }}>
          내 루틴
        </Typography>
        <Button 
          variant="text" 
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{ 
            fontWeight: 700, 
            fontSize: '1rem', 
            color: 'primary.main',
            borderRadius: '12px',
            '&:hover': { bgcolor: 'rgba(49, 130, 246, 0.08)' }
          }}
        >
          새 루틴
        </Button>
      </Box>

      <Stack spacing={2}>
        {routines.map((routine) => (
          <Paper
            key={routine.id}
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '24px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                {activeRoutineId === routine.id && (
                  <Chip label="진행 중" color="primary" size="small" sx={{ mb: 1, mr: 1, fontWeight: 700 }} />
                )}
                <Chip 
                  label={routine.difficulty} 
                  size="small" 
                  sx={{  
                    mb: 1, 
                    fontWeight: 700, 
                    fontSize: '0.75rem',
                    bgcolor: isDark ? 'rgba(49, 130, 246, 0.1)' : '#E8F3FF',
                    color: 'primary.main',
                    borderRadius: '8px'
                  }} 
                />
                <Typography variant="h6" fontWeight="700" sx={{ mb: 0.5, color: 'text.primary' }}>
                  {routine.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {routine.description}
                </Typography>
              </Box>
              <IconButton 
                onClick={() => openDeleteConfirm(routine.id)}
                disabled={deletingId === routine.id}
                size="small"
                sx={{ 
                  color: 'text.disabled',
                  '&:hover': { color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.1)' }
                }}
              >
                {deletingId === routine.id ? <CircularProgress size={20} color="inherit" /> : <DeleteOutlineIcon fontSize="small" />}
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <AccessTimeIcon sx={{ fontSize: 18 }} />
                <Typography variant="caption" fontWeight="600">{routine.duration}분</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <FitnessCenterIcon sx={{ fontSize: 18 }} />
                <Typography variant="caption" fontWeight="600">{routine.exerciseIds.length}개 운동</Typography>
              </Box>
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => handleStart(routine)}
              startIcon={<PlayArrowIcon />}
              sx={{
                borderRadius: '16px',
                height: 52,
                fontSize: '1rem',
                fontWeight: 700,
                bgcolor: 'primary.main',
                boxShadow: '0 4px 12px rgba(49, 130, 246, 0.3)',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  boxShadow: '0 6px 16px rgba(49, 130, 246, 0.4)',
                }
              }}
            >
              시작하기
            </Button>
          </Paper>
        ))}

        {routines.length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 10, 
            px: 2,
            bgcolor: 'background.paper',
            borderRadius: '32px',
            border: `2px dashed ${theme.palette.divider}`
          }}>
            <Typography variant="h6" fontWeight="700" color="text.secondary" gutterBottom>
              아직 루틴이 없습니다
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
              나만의 운동 루틴을 만들고<br/>체계적으로 운동을 시작해보세요.
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => setOpen(true)}
              sx={{ borderRadius: '12px', fontWeight: 600 }}
            >
              루틴 만들기
            </Button>
          </Box>
        )}
      </Stack>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '24px', p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', pb: 1 }}>새 루틴 만들기</DialogTitle>
        <form onSubmit={handleSubmit(handleCreate)}>
          <DialogContent>
            <Stack spacing={3}>
              <TextField
                label="루틴 이름"
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register('name')}
                variant="outlined"
                InputProps={{ sx: { borderRadius: '16px' } }}
              />
              <TextField
                label="설명"
                fullWidth
                multiline
                rows={2}
                error={!!errors.description}
                helperText={errors.description?.message}
                {...register('description')}
                variant="outlined"
                InputProps={{ sx: { borderRadius: '16px' } }}
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>난이도</InputLabel>
                    <Controller
                      name="difficulty"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} label="Difficulty" sx={{ borderRadius: '16px' }}>
                          <MenuItem value="BEGINNER">초보</MenuItem>
                          <MenuItem value="INTERMEDIATE">중급</MenuItem>
                          <MenuItem value="ADVANCED">고급</MenuItem>
                        </Select>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="지속 시간(분)"
                    type="number"
                    fullWidth
                    error={!!errors.duration}
                    helperText={errors.duration?.message}
                    {...register('duration', { valueAsNumber: true })}
                    InputProps={{ sx: { borderRadius: '16px' } }}
                  />
                </Grid>
              </Grid>
              
              <FormControl fullWidth error={!!errors.exerciseIds}>
                <InputLabel>운동 종목 선택</InputLabel>
                <Controller
                  name="exerciseIds"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      multiple
                      input={<OutlinedInput label="운동 종목 선택" sx={{ borderRadius: '16px' }} />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip 
                              key={value} 
                              label={exercises.find(e => e.id === value)?.name} 
                              size="small"
                              sx={{ borderRadius: '8px' }}
                            />
                          ))}
                        </Box>
                      )}
                    >
                      {exercises.map((exercise) => (
                        <MenuItem key={exercise.id} value={exercise.id}>
                          {exercise.name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.exerciseIds && (
                  <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                    {errors.exerciseIds.message}
                  </Typography>
                )}
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpen(false)} sx={{ borderRadius: '12px', color: 'text.secondary', fontWeight: 600 }}>취소</Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: '12px', fontWeight: 700, px: 3 }}>만들기</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog 
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="루틴 삭제"
        message="정말 이 루틴을 삭제하시겠습니까?"
        color="error"
        confirmText="삭제"
      />

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px', fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Routines;
