import React from 'react';
import { Box, Typography, Chip, Button, useTheme } from '@mui/material';
import type { ExerciseType } from '../types';

interface ExerciseCardProps {
  exercise: ExerciseType;
  onSelect?: (exercise: ExerciseType) => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onSelect }) => {
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
        cursor: onSelect ? 'pointer' : 'default',
        '&:hover': {
          backgroundColor: onSelect ? 'action.hover' : 'background.paper',
          transform: onSelect ? 'scale(1.01)' : 'none'
        }
      }}
      onClick={() => onSelect && onSelect(exercise)}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h6" fontWeight="700" color="text.primary" sx={{ mb: 0.5, fontSize: '1.2rem' }}>
          {exercise.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
          {exercise.muscleGroup} • {exercise.category}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip 
          label={exercise.category} 
          size="small" 
          sx={{ 
            fontWeight: 600, 
            borderRadius: '20px', 
            bgcolor: 'action.selected', 
            color: 'text.secondary',
            height: '28px',
            fontSize: '0.75rem',
            border: 'none'
          }} 
        />
        {onSelect && (
          <Button 
            variant="contained" 
            size="small" 
            sx={{ 
                minWidth: 'auto', 
                bgcolor: 'primary.main',
                color: '#fff', // Always white on primary
                fontWeight: 600,
                borderRadius: '20px',
                boxShadow: 'none',
                px: 2,
                '&:hover': {
                    bgcolor: 'primary.dark',
                    boxShadow: 'none'
                },
                display: { xs: 'none', sm: 'block' } 
            }}
          >
            Add
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ExerciseCard;
