import { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, CircularProgress, IconButton, Stack, useTheme, Snackbar, Alert } from '@mui/material';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, parseISO, isSameMonth } from 'date-fns';
import { workoutService } from '../services/workoutService';
import type { WorkoutSession } from '../types';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ConfirmDialog from '../components/ConfirmDialog';

const WorkoutHistory = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [idToConfirm, setIdToConfirm] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false, message: '', severity: 'success'
  });
  const navigate = useNavigate();
  const theme = useTheme();

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      const data = await workoutService.getSessionsByDateRange(start, end);
      setSessions(data);
    } catch (error) {
      console.error("Failed to fetch sessions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [currentDate]);

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

  const openDeleteConfirm = (e: React.MouseEvent, id: number | undefined) => {
    e.stopPropagation();
    setIdToConfirm(id ?? null);
    setConfirmOpen(true);
  };

  const handleDeleteSession = async () => {
    if (!idToConfirm) return;
    try {
        await workoutService.deleteSession(idToConfirm);
        setSessions(prev => prev.filter(s => s.id !== idToConfirm));
        setSnackbar({ open: true, message: '삭제 완료', severity: 'success' });
    } catch (error) {
        console.error("Failed to delete", error);
        setSnackbar({ open: true, message: '삭제 실패', severity: 'error' });
    } finally {
        setIdToConfirm(null);
    }
  };

  const groupedSessions = useMemo(() => {
    const groups: Record<string, WorkoutSession[]> = {};
    sessions.forEach(session => {
        const dateStr = format(parseISO(session.date), 'yyyy-MM-dd');
        if (!groups[dateStr]) groups[dateStr] = [];
        groups[dateStr].push(session);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [sessions]);

  return (
    <Box sx={{ pb: 10 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" fontWeight="800">운동 히스토리</Typography>
      </Box>

      <Paper 
        elevation={0}
        sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            p: 2, 
            mb: 4, 
            borderRadius: 4, 
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper'
        }}
      >
        <IconButton onClick={handlePrevMonth}><ChevronLeftIcon /></IconButton>
        <Typography variant="h6" fontWeight="700">
            {format(currentDate, 'yyyy년 M월')}
        </Typography>
        <IconButton onClick={handleNextMonth} disabled={isSameMonth(currentDate, new Date())}><ChevronRightIcon /></IconButton>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
        </Box>
      ) : sessions.length === 0 ? (
        <EmptyState 
            icon={<FitnessCenterIcon />} 
            title="운동 기록이 없습니다" 
            description={`${format(currentDate, 'M월')}에는 운동을 쉬셨나요?`} 
        />
      ) : (
        <Stack spacing={4}>
            {groupedSessions.map(([date, daySessions]) => (
                <Box key={date}>
                    <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 2, ml: 1, color: 'text.secondary' }}>
                        {format(parseISO(date), 'd일 EEEE')}
                    </Typography>
                    <Stack spacing={2}>
                        {daySessions.map(session => (
                            <Paper 
                                key={session.id} 
                                onClick={() => navigate(`/sessions/${session.id}`)}
                                elevation={0}
                                sx={{ 
                                    p: 2.5, 
                                    borderRadius: 4, 
                                    bgcolor: 'background.paper',
                                    border: `1px solid ${theme.palette.divider}`,
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'scale(1.01)', borderColor: 'primary.main' }
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" fontWeight="700" sx={{ mb: 0.5 }}>
                                            {session.notes || '운동 세션'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" fontWeight="500">
                                            {session.duration}분 · {new Set(session.exercisesPerformed.map(e => e.exerciseName)).size}개 종목
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <IconButton 
                                            size="small" 
                                            color="error" 
                                            onClick={(e) => openDeleteConfirm(e, session.id)}
                                            sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                        <ArrowForwardIosIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                                    </Box>
                                </Box>
                            </Paper>
                        ))}
                    </Stack>
                </Box>
            ))}
        </Stack>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteSession}
        title="기록 삭제"
        message="정말 이 운동 기록을 삭제하시겠습니까?"
        color="error"
        confirmText="삭제"
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
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

export default WorkoutHistory;
