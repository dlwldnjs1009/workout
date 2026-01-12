import React from 'react';
import { Box, Typography, Chip, Button, IconButton, useTheme } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import type { WorkoutRoutine } from '../types';

interface RoutineCardProps {
  routine: WorkoutRoutine;
  onStart?: (routine: WorkoutRoutine) => void;
  onDelete?: (id: number) => void;
}

const RoutineCard: React.FC<RoutineCardProps> = ({ routine, onStart, onDelete }) => {
  const theme = useTheme();

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 3, 
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: 'background.paper',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: 'action.hover',
          transform: 'scale(1.005)'
        }
      }}
    >
      <Box sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => onStart && onStart(routine)}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h6" fontWeight="700" color="text.primary" sx={{ fontSize: '1.2rem' }}>
            {routine.name}
            </Typography>
            <Chip 
                label={routine.difficulty} 
                size="small" 
                sx={{ 
                    fontWeight: 600, 
                    borderRadius: '20px', 
                    bgcolor: 'action.selected', 
                    color: 'text.secondary',
                    height: '24px',
                    fontSize: '0.7rem',
                    border: 'none'
                }} 
            />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
          {routine.duration} mins • {routine.exerciseIds.length} Exercises
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {onStart && (
          <Button 
            variant="contained" 
            size="medium"
            startIcon={<PlayArrowIcon />}
            onClick={() => onStart(routine)}
            sx={{ 
                bgcolor: 'primary.main',
                color: '#fff',
                fontWeight: 600,
                borderRadius: '24px',
                boxShadow: 'none',
                px: 3,
                py: 1,
                textTransform: 'none',
                '&:hover': {
                    bgcolor: 'primary.dark',
                    boxShadow: 'none'
                }
            }}
          >
            Start
          </Button>
        )}
        {onDelete && (
          <IconButton 
            size="small" 
            onClick={() => onDelete(routine.id)}
            sx={{ color: 'text.disabled', '&:hover': { color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
          >
            <DeleteOutlineIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default RoutineCard;
