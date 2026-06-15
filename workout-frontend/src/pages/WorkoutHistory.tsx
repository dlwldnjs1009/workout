import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { Box, Typography, Paper, CircularProgress, IconButton, Stack, useTheme } from '@mui/material';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, parseISO, isSameMonth } from 'date-fns';
import { workoutService } from '../services/workoutService';
import type { WorkoutSession } from '../types';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ReplayIcon from '@mui/icons-material/Replay';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/ToastProvider';

// 세션 아이템 컴포넌트 분리 및 메모이제이션
interface SessionItemProps {
  session: WorkoutSession;
  onNavigate: (id: number | undefined) => void;
  onDelete: (e: React.MouseEvent, id: number | undefined) => void;
  onRepeat: (e: React.MouseEvent, session: WorkoutSession) => void;
  dividerColor: string;
}

const SessionItem = memo(({ session, onNavigate, onDelete, onRepeat, dividerColor }: SessionItemProps) => {
  // useMemo로 운동 종목 수 캐싱
  const exerciseCount = useMemo(
    () => new Set(session.exercisesPerformed.map(e => e.exerciseName)).size,
    [session.exercisesPerformed]
  );

  return (
    <Paper
      onClick={() => onNavigate(session.id)}
      role="button"
      tabIndex={0}
      aria-label={`${session.notes || '운동 세션'} 상세 보기`}
      onKeyDown={(e) => {
        // 카드 자체 포커스 시에만 (내부 반복/삭제 버튼 키 입력은 통과)
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onNavigate(session.id);
        }
      }}
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 4,
        bgcolor: 'background.paper',
        border: `1px solid ${dividerColor}`,
        cursor: 'pointer',
        transition: 'transform 0.2s',
        // content-visibility로 화면 밖 항목 렌더링 최적화
        contentVisibility: 'auto',
        containIntrinsicSize: '0 80px',
        '&:hover': { transform: 'scale(1.01)', borderColor: 'primary.main' }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight="700" sx={{ mb: 0.5 }}>
            {session.notes || '운동 세션'}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight="500">
            {exerciseCount}개 종목
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => onRepeat(e, session)}
            aria-label="이 세션 반복하기"
            sx={{ opacity: 0.7, '&:hover': { opacity: 1, bgcolor: 'rgba(49, 130, 246, 0.1)' } }}
          >
            <ReplayIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(e) => onDelete(e, session.id)}
            aria-label="세션 삭제"
            sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
          <ArrowForwardIosIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
        </Box>
      </Box>
    </Paper>
  );
});
SessionItem.displayName = 'SessionItem';

const WorkoutHistory = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [idToConfirm, setIdToConfirm] = useState<number | null>(null);
  const toast = useToast();
  const navigate = useNavigate();
  const theme = useTheme();

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      const data = await workoutService.getSessionsByDateRange(start, end);
      setSessions(data);
    } catch (error) {
      console.error("Failed to fetch sessions", error);
      toast.error('운동 기록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentDate, toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handlePrevMonth = useCallback(() => setCurrentDate(prev => subMonths(prev, 1)), []);
  const handleNextMonth = useCallback(() => setCurrentDate(prev => addMonths(prev, 1)), []);

  // 콜백 메모이제이션
  const openDeleteConfirm = useCallback((e: React.MouseEvent, id: number | undefined) => {
    e.stopPropagation();
    setIdToConfirm(id ?? null);
    setConfirmOpen(true);
  }, []);

  const handleNavigateToSession = useCallback((id: number | undefined) => {
    if (id) navigate(`/sessions/${id}`);
  }, [navigate]);

  const handleRepeatWorkout = useCallback((e: React.MouseEvent, session: WorkoutSession) => {
    e.stopPropagation();
    navigate('/log-workout', { state: { previousSession: session } });
  }, [navigate]);

  const handleDeleteSession = async () => {
    if (!idToConfirm) return;
    try {
        await workoutService.deleteSession(idToConfirm);
        setSessions(prev => prev.filter(s => s.id !== idToConfirm));
        toast.success('삭제 완료');
    } catch (error) {
        console.error("Failed to delete", error);
        toast.error('삭제 실패');
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
        <IconButton onClick={handlePrevMonth} aria-label="이전 달"><ChevronLeftIcon /></IconButton>
        <Typography variant="h6" fontWeight="700">
            {format(currentDate, 'yyyy년 M월')}
        </Typography>
        <IconButton onClick={handleNextMonth} disabled={isSameMonth(currentDate, new Date())} aria-label="다음 달"><ChevronRightIcon /></IconButton>
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
                            <SessionItem
                                key={session.id}
                                session={session}
                                onNavigate={handleNavigateToSession}
                                onDelete={openDeleteConfirm}
                                onRepeat={handleRepeatWorkout}
                                dividerColor={theme.palette.divider}
                            />
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
    </Box>
  );
};

export default WorkoutHistory;
