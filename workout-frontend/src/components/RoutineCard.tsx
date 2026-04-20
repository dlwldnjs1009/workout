import React from 'react';
import { Box, Typography, Chip, Button, IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import type { WorkoutRoutine } from '../types';
import ListRow from './ListRow';

interface RoutineCardProps {
  routine: WorkoutRoutine;
  onStart?: (routine: WorkoutRoutine) => void;
  onDelete?: (id: number) => void;
}

const RoutineCard: React.FC<RoutineCardProps> = ({ routine, onStart, onDelete }) => {
  return (
    <ListRow
      onClick={onStart ? () => onStart(routine) : undefined}
      ariaLabel={onStart ? `${routine.name} 시작` : undefined}
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              fontSize: '1rem',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {routine.name}
          </Typography>
          <Chip
            label={routine.difficulty}
            size="small"
            sx={{
              fontWeight: 600,
              bgcolor: 'action.selected',
              color: 'text.secondary',
              height: 20,
              fontSize: '0.7rem',
              border: 'none',
              flexShrink: 0,
            }}
          />
        </Box>
      }
      subtitle={`${routine.duration}분 • 운동 ${routine.exerciseIds.length}개`}
      right={
        <>
          {onStart && (
            <Button
              variant="contained"
              size="small"
              startIcon={<PlayArrowIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onStart(routine);
              }}
              sx={{ px: 2 }}
            >
              시작
            </Button>
          )}
          {onDelete && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(routine.id);
              }}
              aria-label={`${routine.name} 루틴 삭제`}
              sx={{
                color: 'text.disabled',
                '&:hover': { color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.1)' },
              }}
            >
              <DeleteOutlineIcon />
            </IconButton>
          )}
        </>
      }
    />
  );
};

export default RoutineCard;
