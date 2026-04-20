import React from 'react';
import { Chip, Button } from '@mui/material';
import type { ExerciseType } from '../types';
import ListRow from './ListRow';

interface ExerciseCardProps {
  exercise: ExerciseType;
  onSelect?: (exercise: ExerciseType) => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onSelect }) => {
  return (
    <ListRow
      title={exercise.name}
      subtitle={`${exercise.muscleGroup} • ${exercise.category}`}
      onClick={onSelect ? () => onSelect(exercise) : undefined}
      ariaLabel={onSelect ? `${exercise.name} 선택` : undefined}
      right={
        <>
          <Chip
            label={exercise.category}
            size="small"
            sx={{
              fontWeight: 600,
              bgcolor: 'action.selected',
              color: 'text.secondary',
              height: 24,
              fontSize: '0.75rem',
              border: 'none',
            }}
          />
          {onSelect && (
            <Button
              variant="contained"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(exercise);
              }}
              sx={{ minWidth: 'auto', px: 2, fontSize: '0.85rem' }}
            >
              추가
            </Button>
          )}
        </>
      }
    />
  );
};

export default ExerciseCard;
