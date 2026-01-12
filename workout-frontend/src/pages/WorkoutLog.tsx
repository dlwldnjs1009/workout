import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm, useFieldArray, FormProvider, useWatch, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box, Typography, Button, TextField, Paper, Grid, IconButton,
  Chip, Collapse, Stack, useTheme, useMediaQuery, Fab, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Slider
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { useNavigate, useLocation } from 'react-router-dom';
import { Reorder, useDragControls } from 'framer-motion';
import SuccessFeedback from '../components/SuccessFeedback';
import { workoutService } from '../services/workoutService';
import type { WorkoutRoutine, WorkoutSession } from '../types';
import { useWorkoutStore } from '../store/workoutStore';
import { useWorkoutSessionStore } from '../store/workoutSessionStore';
import BottomSheet from '../components/BottomSheet';
import VerticalScrollSelector from '../components/VerticalScrollSelector';
import {HorizontalScrollSelector} from "../components/NumberInputSelector.tsx";
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

const RPE_OPTIONS = [
    { value: 10, label: '10 (이게 한계다)' },
    { value: 9.5, label: '9.5 (1개 더 할 수 있으려나?)' },
    { value: 9, label: '9 (확실히 1개 더 가능)' },
    { value: 8.5, label: '8.5 (2개 더 할 수 있으려나?)' },
    { value: 8, label: '8 (확실히 2개 더 가능)' },
    { value: 7, label: '7 (꽤 할만 함)' },
    { value: 6, label: '6 (웜업 정도)' },
];

const setRecordSchema = z.object({
  setNumber: z.number().min(1),
  reps: z.number().min(1).max(100),
  weight: z.number().min(0).max(1000),
  duration: z.number().optional(),
  rpe: z.number().optional(),
  completed: z.boolean().optional(),
});

const exercisePerformedSchema = z.object({
  exerciseId: z.number(),
  exerciseName: z.string().optional(),
  sets: z.array(setRecordSchema).min(1),
});

const workoutSessionSchema = z.object({
  date: z.string(),
  duration: z.number().min(0),
  notes: z.string().optional(),
  exercisesPerformed: z.array(exercisePerformedSchema),
});

type WorkoutSessionFormData = z.infer<typeof workoutSessionSchema>;

const CATEGORIES = [
  { value: 'ALL', label: '전체' },
  { value: 'CHEST', label: '가슴' },
  { value: 'BACK', label: '등' },
  { value: 'LEGS', label: '하체' },
  { value: 'SHOULDERS', label: '어깨' },
  { value: 'ARMS', label: '팔' },
  { value: 'ABS', label: '복근' },
  { value: 'CARDIO', label: '유산소' },
];

const REP_VALUES = Array.from({ length: 100 }, (_, i) => i + 1);
const WEIGHT_VALUES = Array.from({ length: 10001 }, (_, i) => Math.round(i * 0.1 * 10) / 10);

const PickerContent = ({
    activePicker,
    onClose
}: {
    activePicker: { exerciseIndex: number, setIndex: number, type: 'reps' | 'weight' | 'rpe' },
    onClose: () => void
}) => {
    const { control, setValue } = useFormContext<WorkoutSessionFormData>();
    const { exerciseIndex, setIndex, type } = activePicker;

    const fieldPath = `exercisesPerformed.${exerciseIndex}.sets.${setIndex}.${type}` as const;
    const value = useWatch({
        control,
        name: fieldPath
    }) as number;

    if (type === 'rpe') {
        const handleRpeSelect = (val: number | undefined) => {
            setValue(fieldPath, val);
            onClose();
        };

        return (
            <Box sx={{ py: 2 }}>
                <Stack spacing={1}>
                    <Button
                        variant={value === undefined ? 'contained' : 'outlined'}
                        onClick={() => handleRpeSelect(undefined)}
                        sx={{ 
                            justifyContent: 'flex-start', 
                            py: 1.5, 
                            borderRadius: '12px',
                            fontWeight: 700,
                            borderColor: value === undefined ? 'primary.main' : 'divider'
                        }}
                    >
                        선택해제
                    </Button>
                    {RPE_OPTIONS.map((option) => (
                        <Button
                            key={option.value}
                            variant={value === option.value ? 'contained' : 'outlined'}
                            onClick={() => handleRpeSelect(option.value)}
                            sx={{ 
                                justifyContent: 'space-between', 
                                py: 1.5, 
                                borderRadius: '12px',
                                fontWeight: 700,
                                borderColor: value === option.value ? 'primary.main' : 'divider'
                            }}
                        >
                            <span>{option.label}</span>
                        </Button>
                    ))}
                </Stack>
            </Box>
        );
    }

    const [inputValue, setInputValue] = useState(String(value));
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!isEditing) {
            setInputValue(String(value));
        }
    }, [value, isEditing]);

    const adjustValue = (amount: number) => {
        let newValue = value + amount;
        if (type === 'weight') {
            newValue = Math.max(0, Math.min(1000, newValue));
            newValue = Math.round(newValue * 10) / 10;
        } else {
            newValue = Math.max(1, Math.min(100, Math.round(newValue)));
        }
        setValue(fieldPath, newValue);
        setInputValue(String(newValue));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setInputValue(text);

        if (text === '' || text === '.' || text.endsWith('.')) {
            return;
        }

        const parsed = parseFloat(text);
        if (!isNaN(parsed)) {
            const clamped = type === 'weight'
                ? Math.max(0, Math.min(1000, parsed))
                : Math.max(1, Math.min(100, Math.round(parsed)));
            setValue(fieldPath, clamped);
        }
    };

    const handleInputBlur = () => {
        setIsEditing(false);
        const parsed = parseFloat(inputValue);
        if (isNaN(parsed) || inputValue === '') {
            setInputValue(String(value));
        } else {
            const clamped = type === 'weight'
                ? Math.max(0, Math.min(1000, parsed))
                : Math.max(1, Math.min(100, Math.round(parsed)));
            setValue(fieldPath, clamped);
            setInputValue(String(clamped));
        }
    };

    const handleScrollChange = (val: number) => {
        if (!isEditing) {
            setValue(fieldPath, val);
            setInputValue(String(val));
        }
    };

    return (
        <Box sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                <TextField
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsEditing(true)}
                    onBlur={handleInputBlur}
                    type="text"
                    inputMode="decimal"
                    variant="standard"
                    sx={{ maxWidth: 200 }}
                    inputProps={{
                        style: { textAlign: 'center', fontSize: '2.5rem', fontWeight: 800 },
                        pattern: type === 'weight' ? '[0-9]*\\.?[0-9]*' : '[0-9]*'
                    }}
                    InputProps={{
                        disableUnderline: true,
                        endAdornment: <InputAdornment position="end" sx={{ '& .MuiTypography-root': { fontWeight: 700, fontSize: '1.2rem' } }}>
                            {type === 'weight' ? 'kg' : '회'}
                        </InputAdornment>
                    }}
                />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4, px: 1, width: '100%' }}>
                {type === 'weight' ? (
                    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                        {[-10, -5, 5, 10].map((val) => (
                            <Button 
                                key={val}
                                fullWidth 
                                variant="outlined" 
                                onClick={() => adjustValue(val)} 
                                sx={{ 
                                    borderRadius: '16px', 
                                    fontWeight: 800, 
                                    fontSize: '1.1rem',
                                    py: 2, 
                                    minWidth: 0,
                                    flex: 1
                                }}
                            >
                                {val > 0 ? `+${val}` : val}
                            </Button>
                        ))}
                    </Stack>
                ) : (
                    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                        {[-5, -1, 1, 5].map((val) => (
                            <Button 
                                key={val}
                                fullWidth 
                                variant="outlined" 
                                onClick={() => adjustValue(val)} 
                                sx={{ 
                                    borderRadius: '16px', 
                                    fontWeight: 800, 
                                    fontSize: '1.1rem',
                                    py: 2, 
                                    minWidth: 0,
                                    flex: 1
                                }}
                            >
                                {val > 0 ? `+${val}` : val}
                            </Button>
                        ))}
                    </Stack>
                )}
            </Box>

            {type === 'weight' ? (
                <HorizontalScrollSelector
                    values={WEIGHT_VALUES}
                    selectedValue={value}
                    onChange={handleScrollChange}
                    suffix="kg"
                />
            ) : (
                <VerticalScrollSelector
                    values={REP_VALUES}
                    selectedValue={value}
                    onChange={handleScrollChange}
                    suffix="회"
                />
            )}

            <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={onClose}
                sx={{ mt: 4, borderRadius: '16px', py: 2, fontWeight: 800, fontSize: '1.1rem' }}
            >
                확인
            </Button>
        </Box>
    );
};

const ExerciseSetCount = ({ index }: { index: number }) => {
    const sets = useWatch({ name: `exercisesPerformed.${index}.sets` });
    return (
        <Typography variant="caption" sx={{ bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: '6px', fontWeight: 700 }}>
            {sets?.length || 0} 세트
        </Typography>
    );
};

const ExerciseSetsList = ({ 
    exerciseIndex, 
    openPicker, 
    removeSet,
    addSet,
    toggleSetCompletion
}: { 
    exerciseIndex: number, 
    openPicker: (exIdx: number, sIdx: number, type: 'reps' | 'weight' | 'rpe') => void,
    removeSet: (exIdx: number, sIdx: number) => void,
    addSet: (exIdx: number) => void,
    toggleSetCompletion: (exIdx: number, sIdx: number) => void
}) => {
    const theme = useTheme();
    const sets = useWatch({ name: `exercisesPerformed.${exerciseIndex}.sets` }) as any[];

    return (
        <Stack spacing={1}>
            {sets?.map((set, sIdx) => (
                <Box 
                    key={sIdx} 
                    sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: { xs: 1, sm: 2 }, 
                        p: 1.5, 
                        bgcolor: set.completed 
                            ? (theme.palette.mode === 'dark' ? 'rgba(49, 130, 246, 0.15)' : '#e8f3ff') 
                            : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8f9fa'),
                        borderRadius: '12px',
                        transition: 'background-color 0.2s ease'
                    }}
                >
                    <Box 
                        onClick={() => toggleSetCompletion(exerciseIndex, sIdx)}
                        sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        {set.completed ? (
                            <CheckBoxIcon color="primary" />
                        ) : (
                            <CheckBoxOutlineBlankIcon color="action" />
                        )}
                    </Box>
                    
                    <Typography variant="body2" fontWeight="700" sx={{ minWidth: 20, color: 'text.secondary' }}>{sIdx + 1}</Typography>
                    
                    <Box sx={{ flex: 1, display: 'flex', gap: 1, overflowX: 'auto' }}>
                        <Box 
                            onClick={() => openPicker(exerciseIndex, sIdx, 'weight')}
                            sx={{ flex: 1, minWidth: 60, p: 1, bgcolor: 'background.paper', borderRadius: '8px', border: `1px solid ${theme.palette.divider}`, textAlign: 'center', cursor: 'pointer' }}
                        >
                            <Typography variant="caption" display="block" color="text.secondary">무게</Typography>
                            <Typography variant="body1" fontWeight="700">{set.weight} kg</Typography>
                        </Box>
                        <Box 
                            onClick={() => openPicker(exerciseIndex, sIdx, 'reps')}
                            sx={{ flex: 1, minWidth: 60, p: 1, bgcolor: 'background.paper', borderRadius: '8px', border: `1px solid ${theme.palette.divider}`, textAlign: 'center', cursor: 'pointer' }}
                        >
                            <Typography variant="caption" display="block" color="text.secondary">횟수</Typography>
                            <Typography variant="body1" fontWeight="700">{set.reps} 회</Typography>
                        </Box>
                         <Box 
                            onClick={() => openPicker(exerciseIndex, sIdx, 'rpe')}
                            sx={{ flex: 1, minWidth: 60, p: 1, bgcolor: 'background.paper', borderRadius: '8px', border: `1px solid ${theme.palette.divider}`, textAlign: 'center', cursor: 'pointer' }}
                        >
                            <Typography variant="caption" display="block" color="text.secondary">RPE</Typography>
                            <Typography variant="body1" fontWeight="700">{set.rpe ?? '-'}</Typography>
                        </Box>
                    </Box>

                    <IconButton onClick={() => removeSet(exerciseIndex, sIdx)} size="small" sx={{ color: 'text.disabled' }}>
                        <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                </Box>
            ))}
            <Button 
                fullWidth 
                startIcon={<AddIcon />} 
                onClick={() => addSet(exerciseIndex)}
                sx={{ mt: 1, py: 1, borderRadius: '12px', color: 'text.secondary', border: `1px dashed ${theme.palette.divider}` }}
            >
                세트 추가
            </Button>
        </Stack>
    );
};

const SortableExerciseItem = React.memo(({ 
    field, 
    index, 
    remove, 
    toggleExpand, 
    isExpanded, 
    openPicker, 
    removeSet, 
    addSet, 
    toggleSetCompletion,
    theme
}: any) => {
    const dragControls = useDragControls();
    const exerciseName = field.exerciseName;

    return (
        <Reorder.Item 
            value={field.id} 
            id={field.id} 
            dragListener={false} 
            dragControls={dragControls}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ 
                duration: 0.2 
            }}
            style={{ 
                listStyle: 'none', 
                position: 'relative',
                marginBottom: '16px' 
            }}
            whileDrag={{ 
                zIndex: 999,
                scale: 1.02,
                boxShadow: "0 12px 40px rgba(0,0,0,0.12)" 
            }}
        >
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 0, 
                    borderRadius: '24px', 
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.paper',
                    overflow: 'hidden',
                    userSelect: 'none',
                    transform: 'translateZ(0)'
                }}
            >
                <Box
                    sx={{ p: 2, display: 'flex', alignItems: 'center' }}
                >
                     <Box 
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            dragControls.start(e);
                        }}
                        sx={{ 
                            cursor: 'grab', 
                            display: 'flex', 
                            alignItems: 'center', 
                            p: 1.5, 
                            mr: 1,
                            color: 'text.disabled', 
                            touchAction: 'none',
                            '&:active': { cursor: 'grabbing', color: 'primary.main' },
                            '&:hover': { color: 'text.secondary' }
                        }}
                    >
                        <DragIndicatorIcon />
                    </Box>

                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <Box
                            onClick={() => toggleExpand(index)}
                            sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="h6" fontWeight="700" color="primary.main" sx={{ whiteSpace: 'nowrap' }}>{exerciseName}</Typography>
                                <ExerciseSetCount index={index} />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <IconButton size="small" sx={{ mr: 1 }}>
                                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Box>
                        </Box>
                        
                         <IconButton
                            onClick={(e) => {
                                e.stopPropagation();
                                remove(index);
                            }}
                            color="error"
                            size="small"
                            sx={{
                                opacity: 0.6,
                                '&:hover': { opacity: 1, bgcolor: 'error.light', color: 'error.contrastText' }
                            }}
                        >
                            <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
                
                <Collapse in={isExpanded}>
                    <Box sx={{ p: 2.5, pt: 0, pl: 6 }}>
                        <ExerciseSetsList 
                            exerciseIndex={index} 
                            openPicker={openPicker} 
                            removeSet={removeSet}
                            addSet={addSet}
                            toggleSetCompletion={toggleSetCompletion}
                        />
                    </Box>
                </Collapse>
            </Paper>
        </Reorder.Item>
    );
}, (prev, next) => {
    return prev.field.id === next.field.id && 
           prev.index === next.index && 
           prev.isExpanded === next.isExpanded;
});

const areArraysEqual = (left: string[], right: string[]) =>
    left.length === right.length && left.every((value, index) => value === right[index]);

const WorkoutLog = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const exercises = useWorkoutStore((state) => state.exercises);
  const fetchExercises = useWorkoutStore((state) => state.fetchExercises);
  const invalidateSessions = useWorkoutStore((state) => state.invalidateSessions);
  const [showSuccess, setShowSuccess] = useState(false);
  const routineToStart = location.state?.routine as WorkoutRoutine | undefined;
  
  const { 
      wipSession, saveWipSession, clearWipSession,
      restTimerSeconds, isRestTimerRunning, startRestTimer, stopRestTimer,
      updateRestTimer, restTimerDuration, setRestTimerDuration
  } = useWorkoutSessionStore();

  const [expandedExercises, setExpandedExercises] = useState<Record<number, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activePicker, setActivePicker] = useState<{ exerciseIndex: number, setIndex: number, type: 'reps' | 'weight' | 'rpe' } | null>(null);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<number>>(new Set());
  const [timerSettingsOpen, setTimerSettingsOpen] = useState(false);

  useEffect(() => {
    let interval: number;
    if (isRestTimerRunning) {
        interval = window.setInterval(() => {
            updateRestTimer();
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRestTimerRunning, updateRestTimer]);

  const defaultFormValues = useMemo(() => {
    if (routineToStart) {
      return {
        date: new Date().toISOString().split('T')[0],
        duration: 0,
        notes: '',
        exercisesPerformed: []
      };
    }
    if (wipSession) {
      return {
        ...wipSession,
        date: wipSession.date || new Date().toISOString().split('T')[0]
      };
    }
    return {
      date: new Date().toISOString().split('T')[0],
      duration: 0,
      notes: '',
      exercisesPerformed: []
    };
  }, [routineToStart, wipSession]);

  const methods = useForm<WorkoutSessionFormData>({
    resolver: zodResolver(workoutSessionSchema),
    defaultValues: defaultFormValues
  });

  const { control, register, handleSubmit, setValue, watch, getValues, formState: { isSubmitting } } = methods;

  useEffect(() => {
    const subscription = watch((value) => {
        const timeout = setTimeout(() => {
            saveWipSession(value);
        }, 1000);
        return () => clearTimeout(timeout);
    });
    return () => subscription.unsubscribe();
  }, [watch, saveWipSession]);

  const { fields, append, remove, move } = useFieldArray({
    control, 
    name: "exercisesPerformed"
  });

  const [exerciseOrder, setExerciseOrder] = useState<string[]>(() =>
      fields.map(field => field.id)
  );

  useEffect(() => {
      const fieldIds = fields.map(field => field.id);
      setExerciseOrder(prev => {
          const next = prev.filter(id => fieldIds.includes(id));
          const missing = fieldIds.filter(id => !next.includes(id));
          const merged = [...next, ...missing];
          return areArraysEqual(merged, prev) ? prev : merged;
      });
  }, [fields]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  useEffect(() => {
    if (routineToStart && exercises.length > 0) {
        setValue('notes', routineToStart.name);
        const routineExercises = routineToStart.exerciseIds.map(exId => {
            const ex = exercises.find(e => e.id === exId);
            return {
                exerciseId: exId,
                exerciseName: ex?.name || 'Unknown',
                sets: [{ setNumber: 1, reps: 10, weight: 40 }]
            };
        });
        setValue('exercisesPerformed', routineExercises);
    }
  }, [routineToStart, exercises, setValue]);

  const filteredExercises = useMemo(() => {
    if (selectedCategory === 'ALL') return exercises;
    return exercises.filter(ex => ex.category === selectedCategory);
  }, [exercises, selectedCategory]);

  const onSubmit = async (data: WorkoutSessionFormData) => {
    try {
      const payload: Partial<WorkoutSession> = {
        date: data.date, 
        duration: data.duration,
        notes: data.notes,
        exercisesPerformed: data.exercisesPerformed.flatMap(ep =>
          ep.sets.map(s => ({
            exerciseId: ep.exerciseId,
            setNumber: s.setNumber,
            reps: s.reps,
            weight: s.weight,
            duration: s.duration,
            rpe: s.rpe,
          }))
        )
      };

      await workoutService.createSession(payload);
      invalidateSessions();
      clearWipSession();
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to save workout', error);
      alert('저장에 실패했습니다.');
    }
  };

  const toggleExpand = useCallback((index: number) => {
    setExpandedExercises(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  }, []);

  const toggleExerciseSelection = (exerciseId: number) => {
    setSelectedExerciseIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  const addSelectedExercises = () => {
    if (selectedExerciseIds.size === 0) return;

    selectedExerciseIds.forEach(exerciseId => {
      const ex = exercises.find(e => e.id === exerciseId);
      if (ex) {
        append({
          exerciseId: ex.id,
          exerciseName: ex.name,
          sets: [{ setNumber: 1, reps: 10, weight: 20 }]
        });
      }
    });

    setSelectedExerciseIds(new Set());

    setTimeout(() => {
      document.getElementById('active-exercises')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const addSet = useCallback((exerciseIndex: number) => {
    const currentSets = getValues(`exercisesPerformed.${exerciseIndex}.sets`);
    const lastSet = currentSets[currentSets.length - 1];
    const newSet = {
      setNumber: currentSets.length + 1,
      reps: lastSet?.reps || 10,
      weight: lastSet?.weight || 0,
    };
    
    const updatedExercises = [...getValues('exercisesPerformed')];
    updatedExercises[exerciseIndex].sets.push(newSet);
    setValue('exercisesPerformed', updatedExercises);
    
    startRestTimer();
  }, [getValues, setValue, startRestTimer]);

  const removeSet = useCallback((exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...getValues('exercisesPerformed')];
    updatedExercises[exerciseIndex].sets.splice(setIndex, 1);
    updatedExercises[exerciseIndex].sets.forEach((s, i) => s.setNumber = i + 1);
    setValue('exercisesPerformed', updatedExercises);
  }, [getValues, setValue]);
  
  const toggleSetCompletion = useCallback((exerciseIndex: number, setIndex: number) => {
      const fieldPath = `exercisesPerformed.${exerciseIndex}.sets.${setIndex}.completed` as const;
      const current = getValues(fieldPath);
      setValue(fieldPath, !current);
      
      if (!current) {
          startRestTimer();
      }
  }, [getValues, setValue, startRestTimer]);

  const openPicker = useCallback((exIdx: number, sIdx: number, type: 'reps' | 'weight' | 'rpe') => {
    setActivePicker({ exerciseIndex: exIdx, setIndex: sIdx, type });
    setPickerOpen(true);
  }, []);
  
  const onReorderExercises = useCallback((newOrder: string[]) => {
      setExerciseOrder(newOrder);
  }, []);

  useEffect(() => {
      const currentIds = fields.map(field => field.id);
      if (areArraysEqual(currentIds, exerciseOrder)) {
          return;
      }
      const nextIds = [...currentIds];
      exerciseOrder.forEach((id, toIndex) => {
          const fromIndex = nextIds.indexOf(id);
          if (fromIndex === -1 || fromIndex === toIndex) {
              return;
          }
          move(fromIndex, toIndex);
          nextIds.splice(toIndex, 0, nextIds.splice(fromIndex, 1)[0]);
      });
  }, [exerciseOrder, fields, move]);

  const handleRemove = useCallback((index: number) => {
      remove(index);
      setExpandedExercises(prev => {
          const newState = { ...prev };
          delete newState[index];
          return newState;
      });
  }, [remove]);

  return (
    <FormProvider {...methods}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ pb: 12 }}>
        {isRestTimerRunning && (
            <Paper
                elevation={4}
                sx={{
                    position: 'fixed',
                    bottom: isMobile ? 80 : 32,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1200,
                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    px: 3,
                    py: 1.5,
                    borderRadius: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    backdropFilter: 'blur(8px)',
                    width: 'auto',
                    minWidth: 280,
                    justifyContent: 'space-between'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon color="primary" />
                    <Typography variant="h6" fontWeight="700" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {Math.floor(restTimerSeconds / 60)}:{(restTimerSeconds % 60).toString().padStart(2, '0')}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                        size="small" 
                        variant="contained" 
                        color="primary" 
                        onClick={() => {
                            setRestTimerDuration(Math.max(10, restTimerDuration - 10));
                            startRestTimer();
                        }}
                        sx={{ minWidth: 'auto', px: 1.5, borderRadius: '12px', bgcolor: 'rgba(49, 130, 246, 0.2)', color: '#3182F6', boxShadow: 'none', '&:hover': { bgcolor: 'rgba(49, 130, 246, 0.3)' } }}
                    >
                        -10
                    </Button>
                    <Button 
                        size="small" 
                        variant="contained" 
                        color="primary" 
                        onClick={() => {
                            setRestTimerDuration(restTimerDuration + 10);
                            startRestTimer();
                        }}
                        sx={{ minWidth: 'auto', px: 1.5, borderRadius: '12px' }}
                    >
                        +10
                    </Button>
                    <Button 
                        size="small" 
                        variant="outlined" 
                        color="inherit" 
                        onClick={stopRestTimer}
                        sx={{ minWidth: 'auto', px: 1.5, borderRadius: '12px', borderColor: 'rgba(255,255,255,0.3)' }}
                    >
                        종료
                    </Button>
                </Box>
            </Paper>
        )}

        <Box sx={{ position: 'fixed', top: 80, right: 16, zIndex: 100 }}>
             <Fab 
                size="small" 
                color="default" 
                onClick={() => setTimerSettingsOpen(true)}
                sx={{ bgcolor: 'background.paper', boxShadow: theme.shadows[2] }}
            >
                <AccessTimeIcon color={isRestTimerRunning ? "primary" : "action"} />
            </Fab>
        </Box>

        <Dialog 
            open={timerSettingsOpen} 
            onClose={() => setTimerSettingsOpen(false)} 
            maxWidth="xs" 
            fullWidth
            PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
        >
            <DialogTitle fontWeight="800" sx={{ pb: 1, fontSize: '1.3rem' }}>휴식 타이머 설정</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', mt: 1 }}>
                    <TextField
                        label="분"
                        type="number"
                        value={Math.floor(restTimerDuration / 60)}
                        onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setRestTimerDuration(val * 60 + (restTimerDuration % 60));
                        }}
                        InputProps={{ 
                            endAdornment: <InputAdornment position="end">분</InputAdornment>,
                            sx: { borderRadius: '16px', fontWeight: 700, fontSize: '1.2rem' }
                        }}
                        fullWidth
                        variant="outlined"
                    />
                    <TextField
                        label="초"
                        type="number"
                        value={restTimerDuration % 60}
                        onChange={(e) => {
                            const val = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                            setRestTimerDuration(Math.floor(restTimerDuration / 60) * 60 + val);
                        }}
                        InputProps={{ 
                            endAdornment: <InputAdornment position="end">초</InputAdornment>,
                            sx: { borderRadius: '16px', fontWeight: 700, fontSize: '1.2rem' }
                        }}
                        fullWidth
                        variant="outlined"
                    />
                </Box>
                
                <Stack direction="row" spacing={1} sx={{ mb: 4 }}>
                    <Button 
                        fullWidth 
                        variant="outlined" 
                        onClick={() => setRestTimerDuration(Math.max(10, restTimerDuration - 10))}
                        sx={{ borderRadius: '12px', py: 1.5, fontWeight: 700, fontSize: '1rem', borderColor: 'divider', color: 'text.primary' }}
                    >
                        -10초
                    </Button>
                    <Button 
                        fullWidth 
                        variant="outlined" 
                        onClick={() => setRestTimerDuration(restTimerDuration + 10)}
                        sx={{ borderRadius: '12px', py: 1.5, fontWeight: 700, fontSize: '1rem', borderColor: 'divider', color: 'text.primary' }}
                    >
                        +10초
                    </Button>
                </Stack>

                <Typography gutterBottom variant="caption" color="text.secondary" fontWeight="600" sx={{ pl: 1 }}>슬라이더로 빠르게 조절</Typography>
                <Slider
                    value={restTimerDuration}
                    onChange={(_, val) => setRestTimerDuration(val as number)}
                    step={10}
                    min={10}
                    max={300}
                    valueLabelDisplay="auto"
                    marks={[
                        { value: 60, label: '1분' },
                        { value: 120, label: '2분' },
                        { value: 180, label: '3분' }
                    ]}
                    sx={{ mb: 2, mx: 1, width: 'calc(100% - 16px)' }}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button 
                    fullWidth
                    onClick={() => setTimerSettingsOpen(false)} 
                    variant="contained" 
                    size="large"
                    sx={{ borderRadius: '16px', fontWeight: 800, py: 1.5, fontSize: '1.1rem' }}
                >
                    설정 완료
                </Button>
            </DialogActions>
        </Dialog>

        <Box sx={{ mb: 4, px: 1 }}>
          <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.02em', mb: 1 }}>운동 기록</Typography>
          <Typography variant="body1" color="text.secondary">오늘의 땀방울을 기록으로 남기세요</Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
              <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>운동 추가</Typography>
              
              <Box sx={{ mb: 2, display: 'flex', gap: 1, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
                  {CATEGORIES.map(cat => (
                      <Chip 
                          key={cat.value}
                          label={cat.label}
                          onClick={() => setSelectedCategory(cat.value)}
                          color={selectedCategory === cat.value ? 'primary' : 'default'}
                          variant={selectedCategory === cat.value ? 'filled' : 'outlined'}
                          sx={{ fontWeight: 700, borderRadius: '8px', flexShrink: 0 }}
                      />
                  ))}
              </Box>

              <Grid container spacing={1} sx={{ maxHeight: 400, overflowY: 'auto', pr: 1 }}>
                {filteredExercises.map(ex => {
                  const isSelected = selectedExerciseIds.has(ex.id);
                  return (
                    <Grid size={{ xs: 6, sm: 4, md: 12 }} key={ex.id}>
                        <Button
                            fullWidth
                            variant={isSelected ? "contained" : "outlined"}
                            onClick={() => toggleExerciseSelection(ex.id)}
                            startIcon={isSelected ? <CheckIcon /> : <AddIcon />}
                            sx={{
                                justifyContent: 'flex-start',
                                borderRadius: '16px',
                                py: 1.5,
                                px: 2,
                                borderColor: isSelected ? 'primary.main' : 'divider',
                                color: isSelected ? 'primary.main' : 'text.primary',
                                bgcolor: isSelected ? 'rgba(49, 130, 246, 0.08)' : 'background.paper',
                                minHeight: '56px',
                                '&:hover': {
                                    bgcolor: isSelected ? 'rgba(49, 130, 246, 0.12)' : 'action.hover',
                                    borderColor: 'primary.main'
                                },
                                boxShadow: isSelected ? 'none' : 'none'
                            }}
                        >
                            <Box sx={{ 
                                textAlign: 'left', 
                                lineHeight: 1.3,
                                wordBreak: 'keep-all',
                                display: '-webkit-box',
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontWeight: isSelected ? 700 : 500,
                                fontSize: '0.9rem'
                            }}>
                                {ex.name}
                            </Box>
                        </Button>
                    </Grid>
                  );
                })}
              </Grid>

              {selectedExerciseIds.size > 0 && (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={addSelectedExercises}
                  startIcon={<CheckIcon />}
                  sx={{
                    mt: 2,
                    py: 1.5,
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '1rem'
                  }}
                >
                  선택 완료 ({selectedExerciseIds.size}개)
                </Button>
              )}
            </Paper>

            <Paper elevation={0} sx={{ p: 3, borderRadius: '24px', border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>기본 정보</Typography>
              <Stack spacing={3}>
                <TextField
                  label="날짜"
                  type="date"
                  fullWidth
                  {...register('date')}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                />
                <TextField
                  label="총 시간 (분)"
                  type="number"
                  fullWidth
                  {...register('duration', { valueAsNumber: true })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                />
                <TextField
                  label="메모"
                  multiline
                  rows={2}
                  fullWidth
                  {...register('notes')}
                  placeholder="오늘 운동은 어땠나요?"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                />
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }} id="active-exercises">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
              <Typography variant="h6" fontWeight="800" sx={{ color: 'text.primary' }}>진행 중인 운동 ({fields.length})</Typography>
            </Box>
            
            <Reorder.Group axis="y" values={exerciseOrder} onReorder={onReorderExercises} style={{ listStyle: 'none', padding: 0 }}>
                {fields.map((field, exIdx) => (
                    <SortableExerciseItem 
                        key={field.id}
                        field={field}
                        index={exIdx}
                        remove={handleRemove}
                        toggleExpand={toggleExpand}
                        isExpanded={expandedExercises[exIdx] === true}
                        openPicker={openPicker}
                        removeSet={removeSet}
                        addSet={addSet}
                        toggleSetCompletion={toggleSetCompletion}
                        theme={theme}
                    />
                ))}
            </Reorder.Group>
            
            {fields.length === 0 && (
                <Box sx={{ py: 8, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '24px', border: `2px dashed ${theme.palette.divider}` }}>
                  <Typography color="text.disabled" fontWeight="600">추가된 운동이 없습니다</Typography>
                </Box>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSubmitting || fields.length === 0}
              sx={{
                  mt: 4,
                  py: 2,
                  borderRadius: '16px',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  boxShadow: '0 8px 20px rgba(49, 130, 246, 0.3)',
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              기록 완료
            </Button>
          </Grid>
        </Grid>

        {isMobile && fields.length > 0 && (
          <Fab 
            color="primary" 
            variant="extended"
            sx={{ position: 'fixed', bottom: 100, right: 16, zIndex: 1000, fontWeight: 700 }}
            onClick={() => {
                document.getElementById('active-exercises')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <CheckIcon sx={{ mr: 1 }} />
            선택 완료
          </Fab>
        )}

        <BottomSheet
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          title={activePicker?.type === 'weight' ? '무게 선택' : activePicker?.type === 'reps' ? '횟수 선택' : 'RPE 선택'}
        >
          {activePicker && (
              <PickerContent activePicker={activePicker} onClose={() => setPickerOpen(false)} />
          )}
        </BottomSheet>

        <SuccessFeedback 
          open={showSuccess} 
          onClose={() => navigate('/')} 
          message="운동 기록 완료!"
        />
      </Box>
    </FormProvider>
  );
};

export default WorkoutLog;
