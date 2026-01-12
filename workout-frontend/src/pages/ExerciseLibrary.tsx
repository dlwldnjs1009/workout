import { useEffect, useState } from 'react';
import { Box, Typography, TextField, CircularProgress, InputAdornment, MenuItem, Select, FormControl, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useWorkoutStore } from '../store/workoutStore';
import ExerciseCard from '../components/ExerciseCard';

const ExerciseLibrary = () => {
  const exercises = useWorkoutStore((state) => state.exercises);
  const fetchExercises = useWorkoutStore((state) => state.fetchExercises);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const theme = useTheme();

  useEffect(() => {
    const loadExercises = async () => {
      try {
        await fetchExercises();
      } catch (error) {
        console.error('Failed to fetch exercises', error);
      } finally {
        setLoading(false);
      }
    };

    loadExercises();
  }, [fetchExercises]);

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          exercise.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || exercise.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" component="h1" fontWeight="700" gutterBottom sx={{ color: 'text.primary' }}>
          운동 라이브러리
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
          운동 라이브러리를 탐색하세요
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
          <TextField
            fullWidth
            placeholder="운동 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="filled"
            InputProps={{
              disableUnderline: true,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: '16px',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f2f4f6',
                '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#eef0f2' },
                '&.Mui-focused': { bgcolor: 'background.paper', boxShadow: '0 0 0 2px #3182F6 inset' }
              }
            }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              displayEmpty
              variant="filled"
              disableUnderline
              sx={{
                borderRadius: '16px',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f2f4f6',
                '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#eef0f2' },
                '&.Mui-focused': { bgcolor: 'background.paper', boxShadow: '0 0 0 2px #3182F6 inset' }
              }}
            >
              <MenuItem value="ALL">전체 카테고리</MenuItem>
              <MenuItem value="CHEST">가슴</MenuItem>
              <MenuItem value="BACK">등</MenuItem>
              <MenuItem value="LEGS">하체</MenuItem>
              <MenuItem value="ABS">복근</MenuItem>
              <MenuItem value="ARMS">팔</MenuItem>
              <MenuItem value="SHOULDERS">어깨</MenuItem>
              <MenuItem value="CARDIO">유산소</MenuItem>
              <MenuItem value="FLEXIBILITY">유연성</MenuItem>
              <MenuItem value="BALANCE">밸런스</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {filteredExercises.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
        ))}
        {filteredExercises.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="body1" color="text.secondary">
              검색 조건에 맞는 운동을 찾을 수 없습니다.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ExerciseLibrary;
