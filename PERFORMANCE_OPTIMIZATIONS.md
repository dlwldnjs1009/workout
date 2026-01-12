# Performance Optimizations - Detailed Guide

이 문서는 현재 적용된 성능 최적화들을 주니어 풀스택 개발자 관점에서 이해하기 쉽게 설명합니다.
"왜 문제가 되는지", "무엇을 변경했는지", "어떤 효과가 있는지", "주의할 점"을 함께 정리했습니다.

## 1. 프론트엔드 최적화

### 1) 라우트 기반 코드 스플리팅 (React.lazy + Suspense)
- 문제
  - 모든 페이지를 한 번에 import하면 초기 번들에 모든 코드가 포함됩니다.
  - 사용자가 지금 보지 않는 페이지까지 다운로드하므로 첫 화면이 느려집니다.
- 변경
  - 각 페이지를 `React.lazy()`로 분리하고, `Suspense`로 로딩 UI를 표시합니다.
- 효과
  - 초기 로딩 시 필요한 코드만 다운로드하므로 첫 화면이 더 빨리 뜹니다.
- 주의
  - 로딩 동안 보여줄 UI(Skeleton 등)를 반드시 준비해야 합니다.
  - `Suspense` 범위가 너무 넓으면 전체 레이아웃이 사라졌다가 다시 나타날 수 있습니다.
- 관련 파일
  - `workout-frontend/src/App.tsx`

### 2) Vite 빌드 청크 분리 (manualChunks)
- 문제
  - 라이브러리 코드와 앱 코드를 하나의 큰 번들로 빌드하면,
    앱 코드가 조금만 바뀌어도 전체 번들을 다시 다운로드합니다.
- 변경
  - `manualChunks`로 React, MUI, recharts, 폼 라이브러리 등을 별도 청크로 분리했습니다.
- 효과
  - 라이브러리 청크는 캐시가 오래 유지되고, 앱 코드만 다시 받습니다.
  - 재방문 및 업데이트 시 체감 속도가 좋아집니다.
- 주의
  - 청크가 너무 많으면 HTTP 요청이 과도하게 늘 수 있습니다.
- 관련 파일
  - `workout-frontend/vite.config.ts`

### 3) 차트 라이브러리 지연 로딩 (recharts lazy load)
- 문제
  - recharts는 용량이 큰 편인데, 대시보드가 첫 페이지라면 초기 로딩에 포함됩니다.
- 변경
  - 차트는 별도 컴포넌트로 분리하고 `lazy + Suspense`로 필요할 때만 로드합니다.
- 효과
  - 첫 화면에서 차트를 바로 쓰지 않는 경우 초기 번들이 더 작아집니다.
- 주의
  - 차트가 처음 표시될 때는 추가 네트워크 요청이 발생합니다.
- 관련 파일
  - `workout-frontend/src/components/DashboardVolumeChart.tsx`
  - `workout-frontend/src/components/WeeklyWorkoutsChart.tsx`
  - `workout-frontend/src/components/ProgressVolumeChart.tsx`
  - `workout-frontend/src/pages/Dashboard.tsx`
  - `workout-frontend/src/pages/Progress.tsx`

### 4) API 중복 호출 줄이기 (Zustand 캐시)
- 문제
  - 운동 목록/세션 목록 같은 데이터가 여러 페이지에서 각각 호출됩니다.
  - 동일한 데이터를 반복 호출하면 네트워크와 서버 리소스를 낭비합니다.
- 변경
  - Zustand 스토어에 TTL(5분) 캐시를 두고, 로딩 중에는 재호출을 막습니다.
  - 데이터 변경 후에는 `invalidate`로 캐시를 무효화합니다.
- 효과
  - API 호출 수 감소, 화면 전환 속도 개선.
- 주의
  - 캐시 유효 기간 동안은 데이터가 최신이 아닐 수 있습니다.
- 관련 파일
  - `workout-frontend/src/store/workoutStore.ts`
  - 사용처: `ExerciseLibrary.tsx`, `Routines.tsx`, `WorkoutLog.tsx`, `Progress.tsx`

### 5) 불필요한 렌더 줄이기 (memo/useMemo/useCallback)
- 문제
  - 리스트/세트가 많은 화면에서 상태가 바뀔 때마다 전체가 재렌더링됩니다.
- 변경
  - `ExerciseSetList`를 `memo`로 감싸고, 핸들러는 `useCallback`으로 고정했습니다.
  - 파생 데이터(필터, 계산 결과)는 `useMemo`로 캐싱합니다.
- 효과
  - 렌더 횟수 감소, UI 반응성 향상.
- 주의
  - 모든 것을 memoize하면 복잡도가 증가할 수 있습니다. 핫스팟만 적용하세요.
- 관련 파일
  - `workout-frontend/src/pages/WorkoutLog.tsx`
  - `workout-frontend/src/pages/Progress.tsx`

### 6) useTransition 적용
- 문제
  - 카테고리 변경 등 큰 렌더 작업이 클릭 반응을 늦출 수 있습니다.
- 변경
  - `useTransition`으로 렌더 작업을 낮은 우선순위로 처리했습니다.
- 효과
  - 사용자 입력이 더 즉각적으로 반응합니다.
- 관련 파일
  - `workout-frontend/src/pages/WorkoutLog.tsx`

### 7) 대시보드 중복 호출 제거
- 문제
  - 대시보드가 `sessions` 전체를 받아서 히트맵을 다시 계산하고 있었습니다.
- 변경
  - 백엔드에서 내려주는 `heatmapLevels`를 그대로 사용합니다.
- 효과
  - API 호출 감소, 클라이언트 계산량 감소.
- 관련 파일
  - `workout-frontend/src/pages/Dashboard.tsx`

## 2. 백엔드 최적화 및 오류 수정

### 1) 세션 상세 Lazy 초기화 오류 해결
- 문제
  - `/sessions/{id}` 호출 시 `exercisesPerformed`가 LAZY 로딩이라
    트랜잭션 밖에서 접근하면 `could not initialize proxy` 오류가 발생합니다.
- 변경
  - `@EntityGraph`로 필요한 컬렉션을 한 번에 로드.
  - 서비스 메서드를 `@Transactional(readOnly = true)`로 보장.
- 효과
  - 세션 상세 API가 안정적으로 응답합니다.
- 관련 파일
  - `src/main/java/com/example/workout/repository/WorkoutSessionRepository.java`
  - `src/main/java/com/example/workout/service/WorkoutSessionService.java`

### 2) 식단 페이지네이션 + fetch join 충돌 해결
- 문제
  - 컬렉션 fetch join과 pagination을 같이 쓰면 Hibernate가 오류를 냅니다.
- 변경
  - 1) ID만 페이징 쿼리로 가져오고
  - 2) 그 ID 리스트로 식단을 한 번에 조회합니다.
- 효과
  - 오류 없이 페이지네이션 동작, in-memory pagination 회피.
- 관련 파일
  - `src/main/java/com/example/workout/repository/DietSessionRepository.java`
  - `src/main/java/com/example/workout/service/DietSessionService.java`

### 3) 대시보드 통계 쿼리 안정화
- 문제
  - 복잡한 JPQL 서브쿼리가 Hibernate 문법 오류를 발생시켰습니다.
- 변경
  - 통계를 기본 메서드로 분리하여 3개의 간단한 집계 쿼리로 계산합니다.
- 효과
  - 애플리케이션 시작 시 쿼리 오류 제거, 안정적인 계산.
- 관련 파일
  - `src/main/java/com/example/workout/repository/WorkoutSessionRepository.java`

### 4) 대시보드 최근 세션 쿼리 안정화
- 문제
  - 컬렉션 fetch join + pagination 사용 시 Hibernate 오류 발생.
- 변경
  - 최근 세션 조회는 fetch join 없이 제한된 개수만 가져오고 DTO 변환.
- 효과
  - 오류 방지, 대시보드 정상 동작.
- 관련 파일
  - `src/main/java/com/example/workout/repository/WorkoutSessionRepository.java`
  - `src/main/java/com/example/workout/service/WorkoutSessionService.java`

### 5) JWT 필터 캐싱 (매 요청 DB 조회 제거)
- 문제
  - 모든 인증된 요청마다 `loadUserByUsername()`이 DB를 조회합니다.
  - 초당 1000 요청 시 1000개의 불필요한 쿼리가 발생합니다.
- 변경
  - `@Cacheable(value = "userDetails", key = "#username")` 적용.
  - 비밀번호 변경 시 `@CacheEvict`로 캐시 무효화.
- 효과
  - 동일 사용자의 반복 요청 시 DB 조회 제거, 응답 속도 향상.
- 관련 파일
  - `src/main/java/com/example/workout/security/UserDetailsServiceImpl.java`

### 6) ExerciseType 참조 데이터 캐싱
- 문제
  - 운동 종목 목록(88개)이 거의 변경되지 않는데 매번 DB에서 조회합니다.
  - 여러 페이지에서 반복 호출 시 불필요한 쿼리 발생.
- 변경
  - `@Cacheable(value = "exerciseTypes")` 전체 목록 캐싱.
  - `@Cacheable(value = "exercisesByCategory")` 카테고리별 캐싱.
- 효과
  - 참조 데이터 쿼리 80% 이상 감소.
- 관련 파일
  - `src/main/java/com/example/workout/service/ExerciseTypeService.java`

### 7) Heatmap DB 집계 쿼리 (메모리 처리 제거)
- 문제
  - 365일 히트맵 계산을 위해 모든 세션을 메모리로 로드 후 Java Stream으로 처리.
  - 데이터가 많아지면 메모리 사용량 증가 및 CPU 오버헤드 발생.
- 변경
  - `GROUP BY CAST(s.date AS LocalDate)` DB 집계 쿼리로 변경.
  - 날짜별 카운트만 조회하여 메모리 사용 최소화.
- 효과
  - 메모리 사용량 대폭 감소, DB 엔진의 최적화된 집계 활용.
- 관련 파일
  - `src/main/java/com/example/workout/repository/WorkoutSessionRepository.java` (countSessionsByDate)
  - `src/main/java/com/example/workout/service/WorkoutSessionService.java` (getWorkoutDashboard)

### 8) ManyToMany EntityGraph 적용 (WorkoutRoutine)
- 문제
  - 루틴 목록 조회 시 각 루틴의 `exercises` 컬렉션 접근마다 추가 쿼리 발생.
  - 10개 루틴 조회 시 11개 쿼리 (N+1 문제).
- 변경
  - `@EntityGraph(attributePaths = {"exercises"})` 적용.
  - `findByUserIdWithExercises()` 메서드로 한 번에 조회.
- 효과
  - 11개 쿼리 → 1개 쿼리로 감소.
- 관련 파일
  - `src/main/java/com/example/workout/repository/WorkoutRoutineRepository.java`
  - `src/main/java/com/example/workout/service/WorkoutRoutineService.java`

### 9) 복합 인덱스 추가
- 문제
  - `user_id`와 `date` 또는 `difficulty` 조합 조회 시 단일 인덱스만으로 비효율적.
- 변경
  - WorkoutSession: `idx_user_date`, `idx_user_date_desc` 복합 인덱스 추가.
  - WorkoutRoutine: `idx_user_difficulty`, `idx_user_created` 복합 인덱스 추가.
- 효과
  - 사용자별 + 날짜/난이도 필터링 쿼리 성능 향상.
- 관련 파일
  - `src/main/java/com/example/workout/entity/WorkoutSession.java`
  - `src/main/java/com/example/workout/entity/WorkoutRoutine.java`

### 10) HikariCP 커넥션 풀 최적화
- 문제
  - 기본 HikariCP 설정은 소규모 앱에 맞춰져 있어 동시 요청 증가 시 커넥션 부족.
- 변경
  ```properties
  spring.datasource.hikari.maximum-pool-size=20
  spring.datasource.hikari.minimum-idle=5
  spring.datasource.hikari.idle-timeout=300000
  spring.datasource.hikari.connection-timeout=30000
  ```
- 효과
  - 동시 요청 처리 능력 향상, 커넥션 대기 시간 감소.
- 관련 파일
  - `src/main/resources/application.properties`

### 11) Hibernate 배치 및 성능 설정
- 문제
  - INSERT/UPDATE가 건별로 실행되어 대량 데이터 처리 시 비효율적.
  - `show-sql=true`가 프로덕션에서 I/O 오버헤드 유발.
- 변경
  ```properties
  spring.jpa.show-sql=false
  spring.jpa.properties.hibernate.jdbc.batch_size=25
  spring.jpa.properties.hibernate.order_inserts=true
  spring.jpa.properties.hibernate.order_updates=true
  spring.jpa.open-in-view=false
  ```
- 효과
  - 배치 INSERT/UPDATE로 DB 왕복 감소.
  - Open Session In View 비활성화로 커넥션 점유 시간 단축.
- 관련 파일
  - `src/main/resources/application.properties`

### 12) Caffeine 캐시 설정
- 문제
  - 캐시 없이 모든 요청이 DB를 직접 조회.
- 변경
  - Caffeine 캐시 라이브러리 도입.
  - 최대 1000개 항목, 10분 TTL 설정.
  - `userDetails`, `exerciseTypes`, `exercisesByCategory` 캐시 적용.
- 효과
  - 반복 조회 데이터의 응답 속도 대폭 향상.
- 관련 파일
  - `src/main/java/com/example/workout/config/CacheConfig.java`
  - `build.gradle` (caffeine 의존성 추가)

## 3. 검증 방법

### 백엔드
1) 세션 상세
   - GET `/api/sessions/{id}`
   - 기대: exercisesPerformed 포함, lazy init 오류 없음
2) 식단 목록
   - GET `/api/diet-sessions`
   - 기대: pagination 관련 오류 없음

### 프론트엔드
1) 빌드 확인
   - `workout-frontend`에서 `npm run build`
2) 번들 확인
   - Network 탭에서 chart 관련 청크가 필요 시점에만 로드되는지 확인

## 4. 추가 팁 (선택)
- Suspense 범위를 Layout 내부로 이동하면 네비게이션 유지가 가능합니다.
- TanStack Query 도입 시 캐시/동기화가 더 편해집니다.
