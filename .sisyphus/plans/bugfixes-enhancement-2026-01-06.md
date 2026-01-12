# Workout App Bug Fixes & Feature Enhancement Plan

**Date**: 2026-01-06
**Status**: Ready for Implementation

---

## Issues Identified

1. **H2 Console Error**: "No static resource h2-console for request '/h2-console'"
2. **Category Structure**: Current categories (STRENGTH, CARDIO, FLEXIBILITY, BALANCE) don't match user requirements
3. **Muscle Group Granularity**: Need detailed muscle targets (대흉근, 종아리, 대둔근, etc.)
4. **Session Detail**: Recent Activity items don't show session details
5. **Localization**: Some UI text still in English, not fully translated to Korean

---

## Phase 1: Backend Fixes

### 1.1 Fix H2 Console Access

**Problem**: H2 console returns 404 error despite being enabled

**Files to Modify**:
- `src/main/resources/application.properties`

**Changes**:
```properties
# Add these explicit H2 console configurations
spring.h2.console.path=/h2-console
spring.h2.console.settings.web-allow-others=true
```

**Verification**:
- Start backend with `./gradlew bootRun`
- Access `http://localhost:8080/h2-console`
- Should see H2 console login page

---

### 1.2 Refactor Exercise Categories

**Problem**: Current enum doesn't match user's anatomical categorization

**Files to Modify**:
- `src/main/java/com/example/workout/entity/ExerciseType.java`

**Current Enum**:
```java
public enum ExerciseCategory {
    STRENGTH, CARDIO, FLEXIBILITY, BALANCE
}
```

**New Enum**:
```java
public enum ExerciseCategory {
    CHEST,          // 가슴
    BACK,           // 등
    LEGS,           // 하체
    ABS,            // 복근
    ARMS,           // 팔
    SHOULDERS,       // 어깨
    CARDIO,         // 유산소
    FLEXIBILITY,    // 유연성
    BALANCE         // 밸런스
}
```

---

### 1.3 Update Exercise Data with Detailed Muscle Groups

**Problem**: Muscle groups are too generic (Chest, Legs, Back)

**Files to Modify**:
- `src/main/resources/data.sql`
- `bin/main/data.sql` (if exists - update both)

**New Data Structure**:

| Exercise Name | New Category | Target Muscle (Korean) | Target Muscle (English) | Description |
|--------------|-------------|----------------------|------------------------|-------------|
| 벤치 프레스 | CHEST | 대흉근 | Pectoralis Major | 전형적인 가슴 운동 |
| 인클라인 덤벨 프레스 | CHEST | 상부 흉근 | Upper Pectoralis | 상부 흉근 타겟 |
| 덤벨 플라이 | CHEST | 소흉근 | Pectoralis Minor | 흉근 분리 운동 |
| 풀업 | BACK | 광배근 | Latissimus Dorsi | 등 상체 운동 |
| 데드리프트 | BACK | 척추기립근 | Erector Spinae | 후면 체인 운동 |
| 바벨 로우 | BACK | 중견근 | Rhomboid | 중간 등 운동 |
| 스쿼트 | LEGS | 대퇴사두근 | Quadriceps Femoris | 하체 대표 운동 |
| 레그 프레스 | LEGS | 대퇴사두근 | Quadriceps Femoris | 하체 강화 |
| 레그 컬 | LEGS | 햄스트링 | Hamstrings | 대퇴이두근 |
| 카프 레이즈 | LEGS | 비복근 | Gastrocnemius | 종아리 운동 |
| 런지 | LEGS | 대둔근 | Gluteus Maximus | 엉덩이 운동 |
| 크런치 | ABS | 복직근 | Rectus Abdominis | 복근 운동 |
| 플랭크 | ABS | 복사근 | Obliques | 코어 안정화 |
| 레그 레이즈 | ABS | 하복근 | Lower Abdominals | 아랫배 운동 |
| 바벨 컬 | ARMS | 상완이두근 | Biceps Brachii | 이두 운동 |
| 트라이셉스 익스텐션 | ARMS | 상완삼두근 | Triceps Brachii | 삼두 운동 |
| 오버헤드 프레스 | SHOULDERS | 삼각근 | Deltoid | 어깨 운동 |
| 래터럴 레이즈 | SHOULDERS | 측면 삼각근 | Lateral Deltoid | 어깨 옆면 |
| 러닝 | CARDIO | 전신 | Full Body | 유산소 운동 |
| 사이클링 | CARDIO | 하체 | Lower Body | 저충격 유산소 |
| 스트레칭 | FLEXIBILITY | 전신 | Full Body | 유연성 운동 |
| 요가 | FLEXIBILITY | 전신 | Full Body | 밸런스 & 유연성 |
| 밸런스 보드 | BALANCE | 코어 | Core | 균형 감각 |

---

## Phase 2: Frontend Type Updates

### 2.1 Update TypeScript Interfaces

**Files to Modify**:
- `workout-frontend/src/types/index.ts`

**Changes**:
```typescript
export interface ExerciseType {
  id: number;
  name: string;
  category: 'CHEST' | 'BACK' | 'LEGS' | 'ABS' | 'ARMS' | 'SHOULDERS' | 'CARDIO' | 'FLEXIBILITY' | 'BALANCE';
  muscleGroup: string;  // Korean muscle name (대흉근, 광배근, etc.)
  description?: string;
}
```

**Note**: Remove duplicate `ExerciseType` interface definition (lines 62-68 in current file).

---

## Phase 3: Frontend Feature Implementation

### 3.1 Create Session Detail Page

**Problem**: Recent Activity items don't show workout session details

**Files to Create**:
- `workout-frontend/src/pages/SessionDetail.tsx`

**Implementation Requirements**:

```typescript
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Grid, Chip, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { workoutService } from '../services/workoutService';
import type { WorkoutSession } from '../types';
import { format } from 'date-fns';

const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      if (!id) return;
      try {
        // Note: Need to verify if this endpoint exists in backend
        // If not, we may need to add it
        const data = await workoutService.getSessionById(Number(id));
        setSession(data);
      } catch (error) {
        console.error('Failed to fetch session', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  if (loading) return <Box sx={{ p: 4 }}><Typography>로딩 중...</Typography></Box>;
  if (!session) return <Box sx={{ p: 4 }}><Typography>세션을 찾을 수 없습니다</Typography></Box>;

  return (
    <Box>
      {/* Header with back button */}
      <Box sx={{ mb: 4 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          {format(new Date(session.date), 'yyyy년 M월 d일')}
        </Typography>
      </Box>

      {/* Session overview */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: '16px' }}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">운동 시간</Typography>
            <Typography variant="h5" fontWeight="bold">{session.duration}분</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">운동 종목</Typography>
            <Typography variant="h5" fontWeight="bold">
              {session.exercisesPerformed?.length || 0}개
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">메모</Typography>
            <Typography variant="body1">{session.notes || '-'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Exercise details */}
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>운동 상세</Typography>
      {session.exercisesPerformed?.map((record, idx) => (
        <Paper key={idx} sx={{ p: 3, mb: 2, borderRadius: '16px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">{record.exerciseName}</Typography>
            <Chip label={`세트 ${record.setets}`} size="small" />
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">횟수</Typography>
              <Typography variant="h6">{record.reps}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">무게</Typography>
              <Typography variant="h6">{record.weight || 0}kg</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">시간</Typography>
              <Typography variant="h6">{record.duration || 0}분</Typography>
            </Grid>
          </Grid>
        </Paper>
      ))}
    </Box>
  );
};

export default SessionDetail;
```

---

### 3.2 Add Session Detail Route

**Files to Modify**:
- `workout-frontend/src/App.tsx`

**Changes**:
```typescript
// Add import
import SessionDetail from './pages/SessionDetail';

// Add route inside ProtectedRoute section
<Route path="/sessions/:id" element={<SessionDetail />} />
```

---

### 3.3 Make Recent Activity Clickable

**Files to Modify**:
- `workout-frontend/src/pages/Dashboard.tsx`

**Changes** (Lines 176-226):
```typescript
// Wrap the recent activity Paper with onClick handler
<Paper
  key={session.id}
  elevation={0}
  sx={{ /* existing styles */ }}
  onClick={() => navigate(`/sessions/${session.id}`)}
>
  {/* existing content */}
</Paper>
```

---

## Phase 4: Frontend Localization

### 4.1 Exercise Library Translation

**Files to Modify**:
- `workout-frontend/src/pages/ExerciseLibrary.tsx`

**Changes Required**:
- Line 42: `Exercise Library` → `운동 라이브러리`
- Line 44: `Browse our collection of exercises...` → `운동 라이브러리를 탐색하세요`
- Line 51: `Search exercises...` → `운동 검색...`
- Line 84: `All Categories` → `전체 카테고리`

**Category Label Updates** (Lines 85-88):
```typescript
const categoryLabels = {
  ALL: '전체',
  CHEST: '가슴',
  BACK: '등',
  LEGS: '하체',
  ABS: '복근',
  ARMS: '팔',
  SHOULDERS: '어깨',
  CARDIO: '유산소',
  FLEXIBILITY: '유연성',
  BALANCE: '밸런스',
};

// Update Select MenuItem to use Korean labels
<MenuItem value="ALL">{categoryLabels.ALL}</MenuItem>
<MenuItem value="CHEST">{categoryLabels.CHEST}</MenuItem>
<MenuItem value="BACK">{categoryLabels.BACK}</MenuItem>
<MenuItem value="LEGS">{categoryLabels.LEGS}</MenuItem>
<MenuItem value="ABS">{categoryLabels.ABS}</MenuItem>
<MenuItem value="ARMS">{categoryLabels.ARMS}</MenuItem>
<MenuItem value="SHOULDERS">{categoryLabels.SHOULDERS}</MenuItem>
<MenuItem value="CARDIO">{categoryLabels.CARDIO}</MenuItem>
<MenuItem value="FLEXIBILITY">{categoryLabels.FLEXIBILITY}</MenuItem>
<MenuItem value="BALANCE">{categoryLabels.BALANCE}</MenuItem>
```

---

### 4.2 Workout Log Translation

**Files to Modify**:
- `workout-frontend/src/pages/WorkoutLog.tsx`

**Translation Table**:
| English (Line) | Korean | Context |
|----------------|--------|---------|
| `New Workout` (Line 112) | 새 운동 | Routine name display |
| `Details` (Line 118) | 상세 정보 | Section header |
| `Date` (Line 120) | 날짜 | Form label |
| `Duration (min)` (Line 132) | 운동 시간(분) | Form label |
| `Notes` (Line 143) | 메모 | Form label |
| `Exercises` (Line 156) | 운동 종목 | Section header |
| `Add Exercise` (Line 166) | 운동 추가 | Autocomplete label |
| `Search...` (Line 167) | 검색... | Placeholder |
| `Sets` (Line 191) | 세트 | Form label |
| `Reps` (Line 203) | 횟수 | Form label |
| `kg` (Line 215) | kg | Form label |
| `No exercises yet` (Line 231) | 아직 운동이 없습니다 | Empty state |
| `Finish Workout` (Line 280) | 운동 완료 | Submit button |

---

### 4.3 Dashboard Translation Verification

**Files to Modify**:
- `workout-frontend/src/pages/Dashboard.tsx`

**Current Korean Text** (Already translated):
- Line 41-43: Greetings (좋은 아침/오후/저녁입니다) ✅
- Line 62: 다음 운동 세션을 준비하셨나요? ✅
- Line 72: 운동 기록하기 ✅
- Line 76: 개요 ✅
- Line 94: 총 운동 횟수 ✅
- Line 99: 완료된 세션 ✅
- Line 118: 활동 시간 ✅
- Line 142: 마지막 세션 ✅
- Line 153: 아직 운동 기록이 없습니다 ✅
- Line 161: 최근 활동 ✅
- Line 163: 전체 보기 ✅
- Line 169: 첫 운동을 기록하여 여정을 시작하세요! ✅
- Line 171: 지금 기록하기 ✅
- Line 208: 운동 세션 ✅
- Line 216: 개 운동 ✅

**Status**: Dashboard is already fully translated. No changes needed.

---

## Phase 5: Backend API Enhancement (If Needed)

### 5.1 Verify Session Detail Endpoint

**Files to Check**:
- `src/main/java/com/example/workout/controller/WorkoutSessionController.java`

**Expected Endpoint**:
```java
@GetMapping("/{id}")
public ResponseEntity<WorkoutSessionDTO> getSessionById(@PathVariable Long id) {
    // Implementation
}
```

**If Missing**: Add the endpoint to return session details by ID.

---

## Phase 6: Testing & Verification

### 6.1 Backend Verification Checklist

- [ ] H2 console accessible at `http://localhost:8080/h2-console`
- [ ] Can connect to database using JDBC URL: `jdbc:h2:mem:workoutdb`
- [ ] Exercise categories refactored to new enum values
- [ ] All exercises in data.sql updated with detailed muscle groups
- [ ] Backend starts without errors: `./gradlew bootRun`

### 6.2 Frontend Verification Checklist

- [ ] TypeScript compilation succeeds: `npm run build`
- [ ] Exercise Library shows new categories (가슴, 등, 하체, 복근, 팔, 어깨, 유산소, 유연성, 밸런스)
- [ ] Exercise details show specific muscle groups (대흉근, 광배근, etc.)
- [ ] Recent Activity items are clickable
- [ ] Clicking recent activity navigates to session detail page
- [ ] Session detail page shows all exercise records (sets, reps, weight)
- [ ] All English text translated to Korean

### 6.3 Integration Testing

- [ ] Start backend and frontend
- [ ] Create a new workout session
- [ ] View the session in Recent Activity
- [ ] Click on the session to view details
- [ ] Verify all data displays correctly in Korean

---

## Implementation Order

1. **Backend First** (Phase 1):
   - Fix H2 console
   - Refactor ExerciseType enum
   - Update data.sql with new categories and muscle groups

2. **Frontend Types** (Phase 2):
   - Update TypeScript interfaces

3. **Backend API** (Phase 5 - if needed):
   - Add session detail endpoint

4. **Frontend Features** (Phase 3):
   - Create SessionDetail page
   - Add routing
   - Make recent activity clickable

5. **Frontend Localization** (Phase 4):
   - Translate Exercise Library
   - Translate Workout Log

6. **Testing** (Phase 6):
   - Full verification

---

## Estimated Effort

| Phase | Estimated Time |
|-------|---------------|
| Phase 1: Backend Fixes | 1-2 hours |
| Phase 2: Frontend Types | 15 minutes |
| Phase 3: Session Detail | 2-3 hours |
| Phase 4: Localization | 1-2 hours |
| Phase 5: API Enhancement | 30 minutes (if needed) |
| Phase 6: Testing | 1 hour |
| **Total** | **6-9 hours** |

---

## Risk Mitigation

### Risk 1: Breaking Existing Data
**Mitigation**: The category enum change will require database recreation. Since using H2 in-memory with `create-drop`, data will auto-reload on restart. Document this for users.

### Risk 2: Session Detail Endpoint Missing
**Mitigation**: Verify endpoint exists before implementing frontend. If missing, add to backend.

### Risk 3: Translation Inconsistency
**Mitigation**: Use consistent Korean terminology throughout. Review with native speaker if possible.

---

## Notes

- Current codebase uses H2 in-memory database with `ddl-auto=create-drop`, which means schema changes automatically rebuild the database on restart
- Frontend uses Material UI (MUI) components - ensure translations maintain MUI styling conventions
- Date formatting uses `date-fns` library - ensure locale is set to Korean if needed
- All route changes should be tested in both development and production builds

---

**End of Plan**
