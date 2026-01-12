import {useEffect, useState} from 'react';
import {type FieldArrayWithId, useFieldArray, useForm, type UseFormRegister} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {
    Box,
    Button,
    Chip,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import {useNavigate} from 'react-router-dom';
import SuccessFeedback from '../components/SuccessFeedback';
import {dietService} from '../services/dietService';
import {type MealType} from '../types';

const foodEntrySchema = z.object({
    mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
    foodName: z.string().min(1, '음식 이름을 입력해주세요'),
    calories: z.number().min(0, '0 이상의 값을 입력해주세요').max(99999, '최대 99,999kcal'),
    protein: z.number().min(0, '0 이상의 값을 입력해주세요').max(999, '최대 999g'),
    carbs: z.number().min(0, '0 이상의 값을 입력해주세요').max(999, '최대 999g'),
    fat: z.number().min(0, '0 이상의 값을 입력해주세요').max(999, '최대 999g'),
});

const dietSessionSchema = z.object({
    date: z.string(),
    notes: z.string().optional(),
    foodEntries: z.array(foodEntrySchema)
});

type DietSessionFormData = z.infer<typeof dietSessionSchema>;

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

interface MealSectionProps {
    mealType: MealType;
    register: UseFormRegister<DietSessionFormData>;
    remove: (index: number) => void;
    fields: FieldArrayWithId<DietSessionFormData, "foodEntries", "id">[];
    currentEntries: DietSessionFormData['foodEntries'];
}

const MealSection = ({
                         mealType,
                         register,
                         remove,
                         fields,
                         currentEntries
                     }: MealSectionProps) => {
    const mealFields = fields
        .map((field, index) => ({...field, index}))
        .filter((field) => field.mealType === mealType);

    const currentMealValues = currentEntries.filter(entry => entry.mealType === mealType);
    const totalCalories = currentMealValues.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
    const totalCarbs = currentMealValues.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0);
    const totalProtein = currentMealValues.reduce((sum, item) => sum + (Number(item.protein) || 0), 0);
    const totalFat = currentMealValues.reduce((sum, item) => sum + (Number(item.fat) || 0), 0);


    const handleNumberInput = (e: React.FormEvent<HTMLInputElement>, max: number) => {
        const target = e.currentTarget;
        const value = parseFloat(target.value);

        if (value > max) {
            target.value = String(max);
        } else if (value < 0) {
            target.value = "0";
        }
    };

    return (
        <Box sx={{mb: 4}}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, px: 0.5}}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                    <Chip
                        label={mealType === 'BREAKFAST' ? '아침' : mealType === 'LUNCH' ? '점심' : mealType === 'DINNER' ? '저녁' : '간식'}
                        sx={{
                            borderRadius: '8px',
                            fontWeight: 700,
                            height: '32px',
                            bgcolor: 'text.primary',
                            color: 'background.paper',
                            px: 1
                        }}
                    />
                    {totalCalories > 0 && (
                        <Box sx={{display: 'flex', gap: 1, alignItems: 'baseline'}}>
                            <Typography variant="body2" color="text.primary" fontWeight={700}>
                                {totalCalories.toLocaleString()} <Typography component="span" variant="caption"
                                                                             color="text.secondary">kcal</Typography>
                            </Typography>
                            <Typography variant="caption" color="text.secondary"
                                        sx={{display: {xs: 'none', sm: 'inline-block'}, ml: 1}}>
                                탄 {totalCarbs}g · 단 {totalProtein}g · 지 {totalFat}g
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {mealFields.length === 0 ? (
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        textAlign: 'center',
                        bgcolor: 'background.default',
                        borderRadius: 2,
                        borderStyle: 'dashed',
                        borderWidth: 1,
                        borderColor: 'divider',
                        opacity: 0.8
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        기록이 없습니다
                    </Typography>
                </Paper>
            ) : (
                <Stack spacing={2}>
                    {mealFields.map((item) => (
                        <Paper
                            key={item.id}
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            <Box sx={{display: 'flex', gap: 1, alignItems: 'center', mb: 2.5}}>
                                <TextField
                                    {...register(`foodEntries.${item.index}.foodName`)}
                                    placeholder="음식 이름"
                                    variant="standard"
                                    fullWidth
                                    InputProps={{
                                        disableUnderline: true,
                                        style: {fontSize: '1.05rem', fontWeight: 600}
                                    }}
                                />
                                <IconButton
                                    onClick={() => remove(item.index)}
                                    size="small"
                                    sx={{
                                        color: 'text.secondary',
                                        opacity: 0.7,
                                        bgcolor: 'action.hover',
                                        '&:hover': {bgcolor: 'error.main', color: '#fff'}
                                    }}
                                >
                                    <DeleteOutlineIcon fontSize="small"/>
                                </IconButton>
                            </Box>

                            <Grid container spacing={1.5}>
                                <Grid size={{xs: 6, sm: 3}}>
                                    <TextField
                                        {...register(`foodEntries.${item.index}.carbs`, {valueAsNumber: true})}
                                        label="탄수화물"
                                        placeholder="0"
                                        type="number"
                                        variant="filled"
                                        size="small"
                                        fullWidth
                                        slotProps={{
                                            input: {
                                                endAdornment: <InputAdornment position="end"><Typography
                                                    variant="caption"
                                                    color="text.secondary">g</Typography></InputAdornment>,
                                                disableUnderline: true
                                            },
                                            htmlInput: {
                                                sx: {textAlign: 'right', fontWeight: 700},
                                                min: 0,
                                                max: 999,
                                                onInput: (e: React.FormEvent<HTMLInputElement>) => handleNumberInput(e, 999)
                                            }
                                        }}
                                        sx={{
                                            '& .MuiFilledInput-root': {
                                                bgcolor: 'action.hover',
                                                borderRadius: 2,
                                                '&.Mui-focused .MuiInputBase-input': {
                                                    color: 'primary.main',
                                                    fontWeight: 700
                                                }
                                            },
                                            '& .MuiInputLabel-root': {fontSize: '0.85rem'}
                                        }}
                                    />
                                </Grid>
                                <Grid size={{xs: 6, sm: 3}}>
                                    <TextField
                                        {...register(`foodEntries.${item.index}.protein`, {valueAsNumber: true})}
                                        label="단백질"
                                        placeholder="0"
                                        type="number"
                                        variant="filled"
                                        size="small"
                                        fullWidth
                                        slotProps={{
                                            input: {
                                                endAdornment: <InputAdornment position="end"><Typography
                                                    variant="caption"
                                                    color="text.secondary">g</Typography></InputAdornment>,
                                                disableUnderline: true
                                            },
                                            htmlInput: {
                                                sx: {textAlign: 'right', fontWeight: 600},
                                                min: 0,
                                                max: 999,
                                                onInput: (e: React.FormEvent<HTMLInputElement>) => handleNumberInput(e, 999)
                                            }
                                        }}
                                        sx={{
                                            '& .MuiFilledInput-root': {
                                                bgcolor: 'action.hover',
                                                borderRadius: 2,
                                                '&.Mui-focused .MuiInputBase-input': {
                                                    color: 'primary.main',
                                                    fontWeight: 700
                                                }
                                            },
                                            '& .MuiInputLabel-root': {fontSize: '0.85rem'}
                                        }}
                                    />
                                </Grid>
                                <Grid size={{xs: 6, sm: 3}}>
                                    <TextField
                                        {...register(`foodEntries.${item.index}.fat`, {valueAsNumber: true})}
                                        label="지방"
                                        placeholder="0"
                                        type="number"
                                        variant="filled"
                                        size="small"
                                        fullWidth
                                        slotProps={{
                                            input: {
                                                endAdornment: <InputAdornment position="end"><Typography
                                                    variant="caption"
                                                    color="text.secondary">g</Typography></InputAdornment>,
                                                disableUnderline: true
                                            },
                                            htmlInput: {
                                                sx: {textAlign: 'right', fontWeight: 600},
                                                min: 0,
                                                max: 999,
                                                onInput: (e: React.FormEvent<HTMLInputElement>) => handleNumberInput(e, 999)
                                            }
                                        }}
                                        sx={{
                                            '& .MuiFilledInput-root': {
                                                bgcolor: 'action.hover',
                                                borderRadius: 2,
                                                '&.Mui-focused .MuiInputBase-input': {
                                                    color: 'primary.main',
                                                    fontWeight: 700
                                                }
                                            },
                                            '& .MuiInputLabel-root': {fontSize: '0.85rem'}
                                        }}
                                    />
                                </Grid>
                                <Grid size={{xs: 6, sm: 3}}>
                                    <TextField
                                        {...register(`foodEntries.${item.index}.calories`, {valueAsNumber: true})}
                                        label="열량"
                                        placeholder="0"
                                        type="number"
                                        variant="filled"
                                        size="small"
                                        fullWidth
                                        slotProps={{
                                            input: {
                                                endAdornment: <InputAdornment position="end"><Typography
                                                    variant="caption"
                                                    color="text.secondary">kcal</Typography></InputAdornment>,
                                                disableUnderline: true
                                            },
                                            htmlInput: {
                                                sx: {textAlign: 'right', fontWeight: 600},
                                                min: 0,
                                                max: 99999,
                                                onInput: (e: React.FormEvent<HTMLInputElement>) => handleNumberInput(e, 99999)
                                            }
                                        }}
                                        sx={{
                                            '& .MuiFilledInput-root': {
                                                bgcolor: 'rgba(49, 130, 246, 0.08)',
                                                borderRadius: 2,
                                                '&.Mui-focused .MuiInputBase-input': {
                                                    color: 'primary.main',
                                                    fontWeight: 700
                                                }
                                            },
                                            '& .MuiInputLabel-root': {color: 'primary.main', fontSize: '0.85rem'}
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Box>
    );
};

const DietLog = () => {
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const {control, register, handleSubmit, watch, reset, formState: {isDirty}} = useForm<DietSessionFormData>({
        resolver: zodResolver(dietSessionSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            notes: '',
            foodEntries: []
        }
    });

    const {fields, append, remove} = useFieldArray({
        control,
        name: "foodEntries"
    });

    const watchDate = watch('date');
    const foodEntries = watch('foodEntries');

    const totalCalories = foodEntries?.reduce((sum, item) => sum + (Number(item.calories) || 0), 0) || 0;
    const totalCarbs = foodEntries?.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0) || 0;
    const totalProtein = foodEntries?.reduce((sum, item) => sum + (Number(item.protein) || 0), 0) || 0;
    const totalFat = foodEntries?.reduce((sum, item) => sum + (Number(item.fat) || 0), 0) || 0;

    useEffect(() => {
        const fetchSession = async () => {
            setLoading(true);
            try {
                const sessions = await dietService.getDietSessions();
                const sessionForDate = sessions.find(s => s.date === watchDate);

                if (sessionForDate) {
                    reset({
                        date: sessionForDate.date,
                        notes: sessionForDate.notes || '',
                        foodEntries: sessionForDate.foodEntries.map(f => ({
                            mealType: f.mealType,
                            foodName: f.foodName,
                            calories: f.calories,
                            protein: f.protein,
                            carbs: f.carbs,
                            fat: f.fat
                        }))
                    });
                } else {
                    reset({
                        date: watchDate,
                        notes: '',
                        foodEntries: []
                    });
                }
            } catch (error) {
                console.error("Error fetching diet session", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSession();
    }, [watchDate, reset]);

    const onSubmit = async (data: DietSessionFormData) => {
        try {
            await dietService.createDietSession({
                date: data.date,
                notes: data.notes,
                foodEntries: data.foodEntries
            });
            setShowSuccess(true);
        } catch (error) {
            console.error('Failed to save diet log', error);
            alert('저장에 실패했습니다.');
        }
    };

    const addEmptyEntry = (type: MealType) => {
        append({
            mealType: type,
            foodName: '',
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        });
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{pb: 16}}>
            <Box sx={{textAlign: 'left', mb: 4}}>
                <Typography variant="h4" fontWeight="800" color="text.primary" sx={{mt: 2, letterSpacing: '-1px'}}>
                    식단 기록
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{mt: 0.5}}>
                    오늘 먹은 음식을 기록하세요
                </Typography>

                <Paper
                    elevation={0}
                    sx={{
                        mt: 3,
                        p: 3,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                    }}
                >
                    <Box sx={{
                        display: 'flex',
                        flexDirection: {xs: 'column', sm: 'row'},
                        alignItems: {xs: 'flex-start', sm: 'center'},
                        gap: 3
                    }}>
                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>총 섭취 칼로리</Typography>
                            <Typography variant="h3" fontWeight="800"
                                        sx={{letterSpacing: '-1px', color: 'text.primary'}}>
                                {totalCalories.toLocaleString()} <Typography component="span" variant="h6"
                                                                             color="text.secondary"
                                                                             fontWeight={600}>kcal</Typography>
                            </Typography>
                        </Box>

                        <Box
                            sx={{height: {xs: '1px', sm: '60px'}, width: {xs: '100%', sm: '1px'}, bgcolor: 'divider'}}/>

                        <Box sx={{
                            display: 'flex',
                            gap: {xs: 1, sm: 4},
                            flex: 1,
                            justifyContent: 'space-around',
                            width: '100%'
                        }}>
                            <Box sx={{textAlign: 'center'}}>
                                <Typography variant="caption" color="text.secondary" display="block"
                                            mb={0.5}>탄수화물</Typography>
                                <Typography variant="h6" fontWeight="700">{totalCarbs}g</Typography>
                            </Box>
                            <Box sx={{textAlign: 'center'}}>
                                <Typography variant="caption" color="text.secondary" display="block"
                                            mb={0.5}>단백질</Typography>
                                <Typography variant="h6" fontWeight="700">{totalProtein}g</Typography>
                            </Box>
                            <Box sx={{textAlign: 'center'}}>
                                <Typography variant="caption" color="text.secondary" display="block"
                                            mb={0.5}>지방</Typography>
                                <Typography variant="h6" fontWeight="700">{totalFat}g</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            <Grid container spacing={4} sx={{maxWidth: '1000px', mx: 'auto'}}>
                <Grid size={{xs: 12, md: 4}}>
                    <Paper elevation={0}
                           sx={{p: 3, mb: 3, borderRadius: 1, border: '1px solid', borderColor: 'divider'}}>
                        <Typography variant="h6" fontWeight={700} sx={{mb: 2}}>날짜 및 메모</Typography>
                        <TextField
                            label="날짜"
                            type="date"
                            fullWidth
                            InputLabelProps={{shrink: true}}
                            {...register('date')}
                            variant="outlined"
                            sx={{mb: 3}}
                        />
                        <TextField
                            label="메모"
                            multiline
                            rows={3}
                            placeholder="오늘 식단에 대한 메모"
                            fullWidth
                            InputLabelProps={{shrink: true}}
                            {...register('notes')}
                            variant="outlined"
                        />
                    </Paper>

                    <Box sx={{display: {xs: 'none', md: 'block'}}}>
                        <Typography variant="h6" fontWeight="800" gutterBottom sx={{px: 1}}>빠른 추가</Typography>
                        <Stack spacing={1.5}>
                            {MEAL_TYPES.map(type => (
                                <Button
                                    key={type}
                                    variant="outlined"
                                    startIcon={<AddCircleOutlineIcon/>}
                                    onClick={() => addEmptyEntry(type)}
                                    sx={{
                                        justifyContent: 'flex-start',
                                        py: 1.5,
                                        bgcolor: 'background.paper',
                                        color: 'text.primary',
                                        borderColor: 'divider',
                                        borderRadius: 3,
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: 'rgba(49, 130, 246, 0.08)'
                                        }
                                    }}
                                >
                                    {type === 'BREAKFAST' ? '아침' : type === 'LUNCH' ? '점심' : type === 'DINNER' ? '저녁' : '간식'} 추가
                                </Button>
                            ))}
                        </Stack>
                    </Box>
                </Grid>

                <Grid size={{xs: 12, md: 8}}>
                    {MEAL_TYPES.map(type => (
                        <Box key={type}>
                            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
                                <Typography variant="h6" sx={{display: 'none'}}>{type}</Typography>
                                <Button
                                    startIcon={<AddCircleOutlineIcon/>}
                                    onClick={() => addEmptyEntry(type)}
                                    size="small"
                                    sx={{mb: 1, display: {md: 'none'}, borderRadius: 1}}
                                >
                                    {type === 'BREAKFAST' ? '아침' : type === 'LUNCH' ? '점심' : type === 'DINNER' ? '저녁' : '간식'} 추가
                                </Button>
                            </Box>
                            <MealSection
                                mealType={type}
                                register={register}
                                remove={remove}
                                fields={fields}
                                currentEntries={foodEntries}
                            />
                        </Box>
                    ))}
                </Grid>
            </Grid>

            <Box
                sx={{
                    position: 'fixed',
                    bottom: isMobile ? 80 : 32,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'calc(100% - 32px)',
                    maxWidth: '500px',
                    zIndex: 1000,
                }}
            >
                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading || (!isDirty && foodEntries.length === 0)}
                    fullWidth
                    sx={{
                        height: '56px',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        borderRadius: '16px',
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                        textTransform: 'none'
                    }}
                >
                    저장하기
                </Button>
            </Box>

            <SuccessFeedback
                open={showSuccess}
                onClose={() => navigate('/')}
                message="식단 기록 완료!"
            />
        </Box>
    );
};

export default DietLog;
