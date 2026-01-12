import { useState } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { workoutService } from '../services/workoutService';
import { dietService } from '../services/dietService';
import { userService } from '../services/userService';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';

const TodaySummaryCopy = () => {
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false, message: '', severity: 'success'
  });
  const { user } = useAuthStore();

  const handleCopy = async () => {
    let errorSource = "";
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      errorSource = "프로필 정보를 불러오는데 실패했습니다";
      const profile = await userService.getProfile();
      
      errorSource = "운동 정보를 불러오는데 실패했습니다";
      const workoutData = await workoutService.getWorkoutDashboard(tz);
      
      errorSource = "식단 정보를 불러오는데 실패했습니다";
      const [dietSummary, allDietSessions] = await Promise.all([
         dietService.getTodayDietSummary(tz),
         dietService.getDietSessions()
      ]);

      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const todaySessions = workoutData.recentSessions.filter(s => s.date.startsWith(dateStr));
      const todayDiet = allDietSessions.find(s => s.date === dateStr);
      
      const totalTime = todaySessions.reduce((acc, s) => acc + s.duration, 0);
      let todayVolume = 0;

      // Exercise breakdown
      const exercisesMap = new Map<string, string[]>();
      todaySessions.forEach(s => {
          s.exercisesPerformed.forEach(e => {
             const key = e.exerciseName || 'Unknown';
             if (!exercisesMap.has(key)) exercisesMap.set(key, []);
             if (e.weight !== undefined && e.reps !== undefined) {
                 const rpeStr = e.rpe ? ` (RPE ${e.rpe})` : '';
                 exercisesMap.get(key)?.push(`${e.weight}kg x ${e.reps}회${rpeStr}`);
                 todayVolume += e.weight * e.reps;
             }
          });
      });

      let exerciseDetails = "";
      if (exercisesMap.size > 0) {
          exercisesMap.forEach((sets, name) => {
              exerciseDetails += `  - ${name}: ${sets.join(', ')}\n`;
          });
      } else {
          exerciseDetails = "  - 기록된 운동 없음\n";
      }

      // Meal breakdown
      let mealDetails = "";
      if (todayDiet && todayDiet.foodEntries && todayDiet.foodEntries.length > 0) {
          const meals = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
          meals.forEach(m => {
              const entries = todayDiet.foodEntries.filter(f => f.mealType === m);
              if (entries.length > 0) {
                  const mealCals = entries.reduce((acc, f) => acc + f.calories, 0);
                  const mealCarbs = entries.reduce((acc, f) => acc + (f.carbs || 0), 0);
                  const mealProtein = entries.reduce((acc, f) => acc + (f.protein || 0), 0);
                  const mealFat = entries.reduce((acc, f) => acc + (f.fat || 0), 0);
                  const foodList = entries.map(f => f.foodName).join(', ');
                  const typeLabel = m === 'BREAKFAST' ? '아침' : m === 'LUNCH' ? '점심' : m === 'DINNER' ? '저녁' : '간식';
                  mealDetails += `  - ${typeLabel}: ${foodList} (${mealCals}kcal | 탄${mealCarbs} 단${mealProtein} 지${mealFat})\n`;
              }
          });
      } else {
          mealDetails = "  - 기록된 식단 없음\n";
      }

      const summary = `📅 ${dateStr} 오늘의 기록
👤 ${user?.username}님
- 나이: ${profile.age || '-'}세
- 몸무게: ${profile.weight || '-'}kg
- 골격근량: ${profile.skeletalMuscleMass || '-'}kg
- 체지방량: ${profile.bodyFatMass || '-'}kg

🏋️ 운동
- 총 운동 시간: ${totalTime}분
- 수행한 운동:
${exerciseDetails}
- 총 볼륨: ${todayVolume.toLocaleString()}kg

🍽️ 식단
- 총 섭취: ${dietSummary.hasData ? dietSummary.calories.toLocaleString() : 0}kcal
${mealDetails}
- 총 탄수화물: ${dietSummary.carbs || 0}g | 단백질: ${dietSummary.protein || 0}g | 지방: ${dietSummary.fat || 0}g`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(summary);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = summary;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Fallback copy failed', err);
          throw new Error('클립보드 복사에 실패했습니다.');
        } finally {
          document.body.removeChild(textArea);
        }
      }

      setSnackbar({ open: true, message: '클립보드에 복사되었습니다', severity: 'success' });
    } catch (error) {
      console.error('Failed to copy', error);
      setSnackbar({ open: true, message: errorSource || '오늘 요약 복사 실패', severity: 'error' });
    }
  };

  return (
    <>
      <Button 
        startIcon={<ContentCopyIcon />} 
        onClick={handleCopy}
        variant="outlined"
        size="small"
        sx={{ borderRadius: '8px', fontWeight: 600 }}
      >
        오늘 요약 복사
      </Button>
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
    </>
  );
};

export default TodaySummaryCopy;
