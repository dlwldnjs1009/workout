# 운동 기록 애플리케이션

운동 루틴, 세션, 시간 경과에 따른 진행 상황 추적을 위한 완전한 기능을 갖춘 풀스택 운동 기록 애플리케이션입니다.

## 주요 기능

### 사용자 관리
- 사용자 회원가입 및 인증
- JWT 기반 보안 인증
- localStorage를 활용한 영구적인 로그인 세션

### 운동 관리
- 종합적인 운동 라이브러리 탐색
- 카테고리별 운동 필터링 (근력, 유산소, 유연성, 밸런스)
- 근육 그룹 및 설명을 포함한 운동 세부 정보 확인
- 카테고리별로 분류된 15개 이상의 사전 등록된 운동

### 운동 루틴
- 사용자 정의 운동 루틴 생성
- 루틴에 포함할 운동 선택
- 난이도 수준 설정 (초급, 중급, 고급)
- 예상 운동 시간 설정
- 루틴 편집 및 삭제

### 운동 기록
- 내장 타이머로 운동 세션 시작
- 운동 시간 자동 추적
- 현재 운동에 운동 추가
- 세트, 횟수, 무게 기록
- 운동 메모 추가
- 기존 루틴에서 시작

### 진행 상황 추적
- 시간 경과에 따른 운동 빈도 시각화 차트
- 운동 시간 추세 분석
- 최근 운동 기록
- 주간 운동 통계

### 대시보드
- 운동 통계 개요
- 완료한 총 운동 횟수
- 생성한 총 루틴 수
- 총 운동 시간
- 최근 활동 피드

## 기술 스택

### 백엔드
- **Java 21** - 프로그래밍 언어
- **Spring Boot 3.4** - 애플리케이션 프레임워크
- **Spring Security** - JWT 인증 기능이 있는 보안 프레임워크
- **Spring Data JPA** - 데이터베이스 접근
- **H2 Database** - 인메모리 데이터베이스 (H2 콘솔 사용 가능)
- **Gradle** - 빌드 도구
- **Java JWT (jjwt)** - JWT 토큰 생성 및 검증

### 프론트엔드
- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구 및 개발 서버
- **Material UI (MUI)** - 컴포넌트 라이브러리
- **Zustand** - 상태 관리
- **React Router** - 클라이언트 사이드 라우팅
- **Recharts** - 데이터 시각화 차트
- **Axios** - HTTP 클라이언트
- **React Hook Form** - 폼 처리
- **Zod** - 스키마 검증
- **date-fns** - 날짜 조작

## 사전 요구사항

시작하기 전에 다음 소프트웨어가 설치되어 있는지 확인하세요:

- **Java 17 이상** - [JDK 다운로드](https://adoptium.net/)
- **Node.js 20.19+ 또는 22.12+** - [Node.js 다운로드](https://nodejs.org/)
- **Gradle 8.x** (선택사항, Spring Boot에 포함됨)
- **Git** - [Git 다운로드](https://git-scm.com/)

## 설치 및 설정

### 백엔드 설정

1. **백엔드 디렉토리로 이동:**
   ```bash
   cd /Users/jiwon/Documents/coding/workout
   ```

2. **Gradle로 프로젝트 빌드:**
   ```bash
   ./gradlew build
   ```

3. **애플리케이션 실행:**
   ```bash
   ./gradlew bootRun
   ```

   백엔드가 `http://localhost:8080`에서 실행됩니다.

4. **H2 콘솔 접근 (선택사항):**
   - URL: `http://localhost:8080/h2-console`
   - JDBC URL: `jdbc:h2:mem:workoutdb`
   - Username: `sa`
   - Password: (비워둠)

### 프론트엔드 설정

1. **프론트엔드 디렉토리로 이동:**
   ```bash
   cd /Users/jiwon/Documents/coding/workout/workout-frontend
   ```

2. **의존성 설치:**
   ```bash
   npm install
   ```

3. **개발 서버 시작:**
   ```bash
   npm run dev
   ```

   프론트엔드가 `http://localhost:3000` (또는 사용 가능한 다음 포트)에서 실행됩니다.

## 애플리케이션 실행

### 백엔드 시작
```bash
# 루트 디렉토리에서
./gradlew bootRun
```
백엔드 실행 주소: http://localhost:8080

### 프론트엔드 시작
```bash
cd workout-frontend
npm run dev
```
프론트엔드 실행 주소: http://localhost:3000 (3000이 사용 중인 경우 3001, 3002, 3003)

## API 문서

### 기본 URL
```
http://localhost:8080
```

### 인증 엔드포인트

#### 회원가입
```
POST /api/auth/register
Content-Type: application/json

요청 본문:
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}

응답:
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com"
}
```

#### 로그인
```
POST /api/auth/login
Content-Type: application/json

요청 본문:
{
  "username": "johndoe",
  "password": "password123"
}

응답:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com"
}
```

### 운동 엔드포인트 (인증 필요)

#### 전체 운동 조회
```
GET /api/exercises
Authorization: Bearer {token}

응답:
[
  {
    "id": 1,
    "name": "벤치 프레스",
    "category": "STRENGTH",
    "muscleGroup": "가슴",
    "description": "전형적인 가슴 운동"
  }
]
```

#### ID로 운동 조회
```
GET /api/exercises/{id}
Authorization: Bearer {token}
```

#### 운동 생성
```
POST /api/exercises
Authorization: Bearer {token}
Content-Type: application/json

요청 본문:
{
  "name": "데드리프트",
  "category": "STRENGTH",
  "muscleGroup": "등",
  "description": "전신 컴파운드 운동"
}
```

### 루틴 엔드포인트 (인증 필요)

#### 전체 루틴 조회
```
GET /api/routines
Authorization: Bearer {token}

응답:
[
  {
    "id": 1,
    "name": "전신 운동",
    "description": "완전한 전신 루틴",
    "duration": 45,
    "difficulty": "INTERMEDIATE",
    "exerciseIds": [1, 2, 3, 4],
    "userId": 1
  }
]
```

#### ID로 루틴 조회
```
GET /api/routines/{id}
Authorization: Bearer {token}
```

#### 루틴 생성
```
POST /api/routines
Authorization: Bearer {token}
Content-Type: application/json

요청 본문:
{
  "name": "아침 스트레칭",
  "description": "빠른 스트레칭 루틴",
  "duration": 15,
  "difficulty": "BEGINNER",
  "exerciseIds": [5, 6]
}
```

#### 루틴 수정
```
PUT /api/routines/{id}
Authorization: Bearer {token}
Content-Type: application/json

요청 본문:
{
  "name": "수정된 루틴",
  "description": "수정된 설명",
  "duration": 30,
  "difficulty": "INTERMEDIATE",
  "exerciseIds": [1, 2, 3]
}
```

#### 루틴 삭제
```
DELETE /api/routines/{id}
Authorization: Bearer {token}
```

### 세션 엔드포인트 (인증 필요)

#### 전체 세션 조회
```
GET /api/sessions
Authorization: Bearer {token}

응답:
[
  {
    "id": 1,
    "date": "2025-01-06T10:30:00",
    "duration": 45,
    "notes": "훌륭한 운동이었어요!",
    "exercisesPerformed": [1, 2],
    "userId": 1
  }
]
```

#### 세션 생성
```
POST /api/sessions
Authorization: Bearer {token}
Content-Type: application/json

요청 본문:
{
  "date": "2025-01-06T10:30:00",
  "duration": 45,
  "notes": "훌륭한 운동이었어요!",
  "exerciseIds": [1, 2]
}
```

#### ID로 세션 조회
```
GET /api/sessions/{id}
Authorization: Bearer {token}
```

## 데이터베이스 스키마

### 엔티티 관계

```
User (1) -----> (N) WorkoutRoutine
User (1) -----> (N) WorkoutSession

WorkoutRoutine (N) <----> (N) ExerciseType
WorkoutSession (N) <----> (N) ExerciseType

WorkoutSession (1) -----> (N) ExerciseRecord
ExerciseRecord (N) ----> (1) WorkoutSession
```

### 테이블 구조

#### User (사용자)
- `id` (Long, 기본 키)
- `username` (String, 고유)
- `email` (String, 고유)
- `password` (String, BCrypt 해시)

#### ExerciseType (운동 유형)
- `id` (Long, 기본 키)
- `name` (String)
- `category` (Enum: STRENGTH, CARDIO, FLEXIBILITY, BALANCE)
- `muscleGroup` (String)
- `description` (String)

#### WorkoutRoutine (운동 루틴)
- `id` (Long, 기본 키)
- `name` (String)
- `description` (String)
- `duration` (Integer)
- `difficulty` (Enum: BEGINNER, INTERMEDIATE, ADVANCED)
- `exerciseIds` (List<Long>)
- `userId` (Long, User에 대한 외래 키)

#### WorkoutSession (운동 세션)
- `id` (Long, 기본 키)
- `date` (LocalDateTime)
- `duration` (Integer)
- `notes` (String)
- `exerciseIds` (List<Long>)
- `userId` (Long, User에 대한 외래 키)

#### ExerciseRecord (운동 기록)
- `id` (Long, 기본 키)
- `sessionId` (Long, WorkoutSession에 대한 외래 키)
- `exerciseId` (Long, ExerciseType에 대한 외래 키)
- `sets` (Integer)
- `reps` (Integer)
- `weight` (Double)
- `duration` (Integer, 유산소 운동용)

## 사용자 가이드

### 1. 시작하기

#### 회원가입
1. http://localhost:3000에서 애플리케이션 열기
2. 로그인 페이지에서 "회원가입" 클릭
3. 사용자명, 이메일, 비밀번호 입력
4. "회원가입" 클릭하여 계정 생성

#### 로그인
1. 사용자명과 비밀번호 입력
2. "로그인" 클릭
3. 대시보드로 리디렉션됩니다.

### 2. 대시보드

대시보드는 피트니스 여정의 개요를 제공합니다:
- **총 운동 횟수**: 완료한 운동 세션 수
- **총 루틴 수**: 생성한 운동 루틴 수
- **총 운동 시간**: 모든 운동 세션의 총 시간(분)
- **최근 활동**: 최근 5개의 운동 세션

### 3. 운동 라이브러리

운동을 탐색하고 확인하세요:
1. 메뉴에서 "운동"으로 이동
2. 카테고리 필터를 사용하여 유형별 운동 찾기
   - 근력: 웨이트 트레이닝 운동
   - 유산소: 심혈관 운동
   - 유연성: 스트레칭 및 모빌리티
   - 밸런스: 안정성 및 밸런스 운동
3. 목표 근육 그룹을 포함한 운동 세부 정보 확인

### 4. 운동 루틴 생성

1. "루틴"으로 이동
2. "루틴 생성" 버튼 클릭
3. 루틴 세부 정보 입력:
   - 이름: 예, "전신 운동"
   - 설명: 예, "완전한 전신 루틴"
   - 시간: 예상 시간(분)
   - 난이도: 초급, 중급, 고급
4. 자동완성 드롭다운에서 운동 선택
5. 루틴 저장하려면 "생성" 클릭

#### 루틴 편집/삭제
- 루틴 카드에서 "편집" 클릭하여 수정
- 루틴 삭제하려면 "삭제" 클릭 (되돌릴 수 없음)

### 5. 운동 기록

#### 새 운동 시작
1. "운동 기록"으로 이동
2. 타이머가 00:00:00에서 자동으로 시작됩니다.
3. 재생/일시정지 버튼으로 타이머 제어
4. 다시 시작하려면 재설정 클릭

#### 운동에 운동 추가
1. 운동 드롭다운으로 운동 선택
2. 각 운동의 세부 정보 입력:
   - **근력 운동**: 세트, 횟수, 무게
   - **유산소 운동**: 시간(분)
3. "운동 추가" 클릭하여 운동에 추가
4. 운동에 대한 메모 추가(선택사항)

#### 운동 완료
1. 완료되면 "운동 저장" 클릭
2. 운동이 현재 시간과 모든 운동과 함께 저장됩니다.
3. 대시보드로 리디렉션됩니다.

#### 루틴에서 시작
1. "루틴"로 이동
2. 루틴 카드에서 "루틴 시작" 클릭
3. 운동 기록 페이지가 루틴의 운동이 미리 로드된 상태로 열립니다.
4. 세부 정보를 조정하고 운동을 저장하세요.

### 6. 진행 상황 확인

시각화 차트로 피트니스 진행 상황을 추적하세요:
1. "진행 상황"으로 이동
2. **주간 운동 빈도**: 주당 운동 횟수를 보여주는 막대 차트
3. **시간 추세**: 최근 10세션 동안의 운동 시간을 보여주는 선 차트
4. **최근 기록**: 최근 운동 세션 테이블

### 7. 로그아웃
1. 우측 상단의 사용자 아이콘 클릭
2. "로그아웃" 클릭
3. 로그인 페이지로 리디렉션됩니다.

## 프로젝트 구조

### 백엔드 구조
```
/Users/jiwon/Documents/coding/workout/
├── src/main/java/com/workout/
│   ├── WorkoutApplication.java          # 메인 Spring Boot 애플리케이션
│   ├── config/
│   │   ├── SecurityConfig.java            # 보안 및 JWT 설정
│   │   └── JwtUtil.java                  # JWT 토큰 유틸리티
│   ├── controller/
│   │   ├── AuthController.java           # 인증 엔드포인트
│   │   ├── ExerciseController.java       # 운동 CRUD 엔드포인트
│   │   ├── RoutineController.java        # 루틴 CRUD 엔드포인트
│   │   └── SessionController.java        # 세션 CRUD 엔드포인트
│   ├── dto/
│   │   ├── AuthRequest.java              # 로그인/회원가입 요청
│   │   ├── AuthResponse.java             # 인증 응답
│   │   ├── ExerciseRequest.java          # 운동 생성 요청
│   │   ├── RoutineRequest.java           # 루틴 생성 요청
│   │   ├── SessionRequest.java           # 세션 생성 요청
│   │   └── UserDto.java                  # 사용자 데이터 전송 객체
│   ├── entity/
│   │   ├── User.java                     # 사용자 엔티티
│   │   ├── ExerciseType.java             # 운동 엔티티
│   │   ├── WorkoutRoutine.java           # 루틴 엔티티
│   │   ├── WorkoutSession.java           # 세션 엔티티
│   │   └── ExerciseRecord.java           # 운동 기록 엔티티
│   ├── exception/
│   │   └── GlobalExceptionHandler.java   # 중앙 집중식 에러 처리
│   ├── repository/
│   │   ├── UserRepository.java           # 사용자 JPA 레포지토리
│   │   ├── ExerciseRepository.java      # 운동 JPA 레포지토리
│   │   ├── RoutineRepository.java        # 루틴 JPA 레포지토리
│   │   └── SessionRepository.java        # 세션 JPA 레포지토리
│   └── service/
│       ├── UserDetailsServiceImpl.java   # Spring Security용 사용자 세부 정보
│       ├── AuthService.java              # 인증 비즈니스 로직
│       ├── ExerciseService.java          # 운동 비즈니스 로직
│       ├── RoutineService.java           # 루틴 비즈니스 로직
│       └── SessionService.java           # 세션 비즈니스 로직
├── src/main/resources/
│   ├── application.properties            # 애플리케이션 설정
│   └── data.sql                          # 초기 데이터 시딩
└── build.gradle                          # Gradle 빌드 설정
```

### 프론트엔드 구조
```
/Users/jiwon/Documents/coding/workout/workout-frontend/
├── src/
│   ├── App.tsx                           # 라우트가 있는 메인 앱 컴포넌트
│   ├── main.tsx                          # 애플리케이션 진입점
│   ├── components/
│   │   ├── Layout.tsx                    # 내비게이션이 있는 앱 셸
│   │   ├── ProtectedRoute.tsx            # 인증 가드
│   │   ├── WorkoutTimer.tsx              # 타이머 컴포넌트
│   │   ├── ExerciseCard.tsx              # 운동 표시 카드
│   │   └── RoutineCard.tsx               # 루틴 표시 카드
│   ├── pages/
│   │   ├── Login.tsx                     # 로그인 페이지
│   │   ├── Register.tsx                  # 회원가입 페이지
│   │   ├── Dashboard.tsx                 # 메인 대시보드
│   │   ├── WorkoutLog.tsx                # 운동 기록 페이지
│   │   ├── ExerciseLibrary.tsx           # 운동 브라우저
│   │   ├── Routines.tsx                  # 루틴 관리
│   │   └── Progress.tsx                  # 진행 상황 차트
│   ├── services/
│   │   ├── api.ts                        # Axios 인스턴스 설정
│   │   ├── authService.ts               # 인증 API 호출
│   │   └── workoutService.ts             # 운동 API 호출
│   ├── store/
│   │   ├── authStore.ts                  # 인증 상태 관리
│   │   └── workoutStore.ts               # 운동 상태 관리
│   └── types/
│       └── index.ts                      # TypeScript 타입 정의
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 데이터 흐름

### 인증 흐름
1. 사용자 회원가입 → JWT 토큰 생성되어 localStorage에 저장
2. 사용자 로그인 → JWT 토큰 검증되어 저장
3. 보호된 라우트에서 토큰 확인 → 없으면 로그인으로 리디렉션
4. API 호출에 토큰을 Authorization 헤더에 포함 → 서버에서 토큰 검증
5. 토큰 만료 → 사용자 로그아웃, 로그인으로 리디렉션

### 운동 세션 흐름
1. 사용자가 운동 시작 → 타이머 시작
2. 사용자가 운동 추가 → 로컬 세션 상태에 추가
3. 사용자가 운동 저장 → `/api/sessions`로 POST 요청
4. 백엔드가 세션 저장 → 확인 반환
5. 프론트엔드 업데이트 → 대시보드로 리디렉션

### 루틴에서 세션으로 흐름
1. 사용자가 루틴 확인 → "루틴 시작" 클릭
2. 루틴 운동 로드 → 운동 기록 양식에 미리 채워짐
3. 사용자가 세부 정보 조정 → 세션 저장
4. 세션 독립적으로 생성됨 → 루틴과 연결되지 않음

## 보안 기능

- **비밀번호 해싱**: 모든 비밀번호에 BCrypt 암호화
- **JWT 인증**: 상태 없는 토큰 기반 인증
- **보호된 라우트**: 인증된 페이지는 유효한 토큰 필요
- **CORS 설정**: 크로스 오리진 요청이 적절하게 구성됨
- **SQL 인젝션 보호**: JPA 매개변수화된 쿼리

## 개발 노트

### 새 운동 추가
백엔드 리소스의 `data.sql`에 운동 추가:

```sql
INSERT INTO exercise_type (name, category, muscle_group, description)
VALUES ('운동 이름', 'STRENGTH', '목표 근육', '설명');
```

### API 엔드포인트 수정
1. `src/main/java/com/workout/controller/`에서 컨트롤러 메서드 업데이트
2. `src/main/java/com/workout/service/`에서 서비스 레이어 로직 업데이트
3. `workout-frontend/src/types/index.ts`에서 TypeScript 타입 업데이트
4. `workout-frontend/src/services/`에서 API 서비스 호출 업데이트

### 새 페이지 추가
1. `workout-frontend/src/pages/`에서 페이지 컴포넌트 생성
2. `workout-frontend/src/App.tsx`에 라우트 추가
3. `workout-frontend/src/components/Layout.tsx`에 메뉴 항목 추가

## 문제 해결

### 백엔드 문제

**포트 8080이 이미 사용 중인 경우:**
```bash
# 8080 포트의 프로세스 종료
lsof -ti:8080 | xargs kill -9
```

**데이터베이스에 접근할 수 없는 경우:**
- 백엔드가 실행 중인지 확인
- http://localhost:8080/h2-console에서 H2 콘솔 확인

### 프론트엔드 문제

**포트 3000이 이미 사용 중인 경우:**
- Vite가 자동으로 포트 3001, 3002, 3003을 시도합니다.
- 터미널에서 실제 실행 포트 확인

**API 호출 실패:**
- 포트 8080에서 백엔드가 실행 중인지 확인
- 브라우저 콘솔에서 CORS 에러 확인
- localStorage에 JWT 토큰이 있는지 확인

**빌드 에러:**
```bash
# 캐시 지우기 및 재설치
rm -rf node_modules package-lock.json
npm install
```

## 향후 개선 사항

향후 개발을 위한 잠재적 기능:
- [ ] 운동 데이터를 CSV/PDF로 내보내기
- [ ] 소셜 기능 (루틴 공유, 사용자 팔로우)
- [ ] 고급 분석 및 인사이트
- [ ] 피트니스 트래커 통합 (Fitbit, Apple Health)
- [ ] 운동별 비디오 튜토리얼
- [ ] 사용자 정의 운동 카테고리
- [ ] 운동 알림 및 알림 기능
- [ ] 모바일 앱 (React Native)
- [ ] 다국어 지원
- [ ] 다크/라이트 테마 토글

## 라이선스

이 프로젝트는 교육 목적으로 만들어졌습니다.

## 연락처

질문이나 문제가 있는 경우 프로젝트 저장소를 참조하거나 개발 팀에 문의하세요.
