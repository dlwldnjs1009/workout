import { useEffect } from 'react';
import { Box, Typography, IconButton, useTheme } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useWorkoutSessionStore } from '../store/workoutSessionStore';

const WorkoutTimer = ({ onTick }: { onTick?: (seconds: number) => void }) => {
  const { 
    timerSeconds, 
    isRunning, 
    timerStartedAt,
    startTimer, 
    pauseTimer, 
    resetTimer, 
    setTimerSeconds 
  } = useWorkoutSessionStore();
  const theme = useTheme();

  useEffect(() => {
    let interval: any = null;
    
    if (isRunning && timerStartedAt) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - timerStartedAt) / 1000);
        
        if (elapsed >= 0) {
          setTimerSeconds(elapsed);
          if (onTick) onTick(elapsed);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timerStartedAt, setTimerSeconds, onTick]);

  const toggle = () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const reset = () => {
    resetTimer();
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const parts = [];
    if (hours > 0) parts.push(hours.toString().padStart(2, '0'));
    parts.push(minutes.toString().padStart(2, '0'));
    parts.push(secs.toString().padStart(2, '0'));
    
    return parts.join(':');
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        py: 4
      }}
    >
      <Typography 
        variant="h1" 
        component="div" 
        sx={{ 
            fontWeight: '800', 
            fontSize: { xs: '3.5rem', md: '5rem' },
            color: 'text.primary',
            letterSpacing: '-2px',
            fontVariantNumeric: 'tabular-nums',
            mb: 2
        }}
      >
        {formatTime(timerSeconds)}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <IconButton 
            onClick={toggle} 
            sx={{ 
                bgcolor: isRunning ? (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f2f4f6') : 'primary.main', 
                color: isRunning ? 'text.secondary' : '#fff',
                width: 64,
                height: 64,
                transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                '&:hover': {
                    bgcolor: isRunning ? (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : '#e5e8eb') : 'primary.dark',
                    transform: 'scale(1.05)'
                },
                '&:active': {
                    transform: 'scale(0.95)'
                }
            }}
        >
          {isRunning ? <PauseIcon sx={{ fontSize: 32 }} /> : <PlayArrowIcon sx={{ fontSize: 32 }} />}
        </IconButton>
        <IconButton 
            onClick={reset} 
            sx={{ 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f2f4f6', 
                color: 'text.secondary',
                width: 64,
                height: 64,
                transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                '&:hover': { 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : '#e5e8eb',
                    transform: 'scale(1.05)'
                },
                '&:active': {
                    transform: 'scale(0.95)'
                }
            }}
        >
          <RestartAltIcon sx={{ fontSize: 32 }} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default WorkoutTimer;
