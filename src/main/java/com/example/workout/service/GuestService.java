package com.example.workout.service;

import com.example.workout.dto.AuthResponse;
import com.example.workout.entity.ExerciseRecord;
import com.example.workout.entity.ExerciseType;
import com.example.workout.entity.RoutineExercise;
import com.example.workout.entity.User;
import com.example.workout.entity.WorkoutRoutine;
import com.example.workout.entity.WorkoutSession;
import com.example.workout.exception.BusinessException;
import com.example.workout.exception.ErrorCode;
import com.example.workout.repository.ExerciseTypeRepository;
import com.example.workout.repository.UserRepository;
import com.example.workout.repository.WorkoutRoutineRepository;
import com.example.workout.repository.WorkoutSessionRepository;
import com.example.workout.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 회원가입 없이 둘러볼 수 있는 임시 계정을 발급한다.
 * 계정마다 데이터가 격리되고 GUEST_TTL 이후 스케줄러가 삭제한다.
 */
@Service
@RequiredArgsConstructor
public class GuestService {

    static final Duration GUEST_TTL = Duration.ofHours(24);

    /**
     * 동시에 살아 있을 수 있는 게스트 계정 수의 상한. 출처 IP가 몇 개든 users 테이블 증가를
     * 직접 묶는다. TTL 정리가 계속 자리를 비우므로 실질적으로는 백스톱으로만 작동한다.
     *
     * <p>불변식이 아니라 soft limit이다 — 아래 검사와 저장 사이에 다른 트랜잭션이 끼어들 수
     * 있어 동시 요청 수만큼 초과할 수 있다. 발급 속도는 nginx의 limit_req(IP당 10r/m)가
     * 묶으므로 초과분은 한 자리 수에 머문다. 락이나 SERIALIZABLE 격리는 이 트래픽에 과잉이다.
     */
    static final int MAX_LIVE_GUESTS = 2_000;

    private static final String USERNAME_PREFIX = "guest_";
    private static final String EMAIL_DOMAIN = "@guest.todayfit.site";
    private static final String ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final int SUFFIX_LENGTH = 10;

    /** 시드 루틴에 담을 종목 수. 대시보드·진행도 그래프가 비지 않을 최소치. */
    private static final int SEED_EXERCISE_COUNT = 3;
    /** 시드 세션이 놓일 과거 일자(오늘 기준 D-N). 진행도에 상승 추세가 보이도록 3회차. */
    private static final int[] SEED_SESSION_DAYS_AGO = {6, 4, 2};
    private static final int SEED_SETS_PER_EXERCISE = 3;

    private static final List<ExerciseType.ExerciseCategory> SEED_CATEGORY_ORDER = List.of(
        ExerciseType.ExerciseCategory.CHEST,
        ExerciseType.ExerciseCategory.BACK,
        ExerciseType.ExerciseCategory.LEGS,
        ExerciseType.ExerciseCategory.SHOULDERS,
        ExerciseType.ExerciseCategory.ARMS
    );

    private final UserRepository userRepository;
    private final ExerciseTypeRepository exerciseTypeRepository;
    private final WorkoutRoutineRepository routineRepository;
    private final WorkoutSessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    private final SecureRandom random = new SecureRandom();

    @Transactional
    public AuthResponse createGuestSession() {
        if (userRepository.countByGuestTrue() >= MAX_LIVE_GUESTS) {
            throw new BusinessException(ErrorCode.GUEST_LIMIT_REACHED);
        }

        User guest = userRepository.save(newGuestUser());

        List<ExerciseType> seedExercises = pickSeedExercises();
        if (!seedExercises.isEmpty()) {
            WorkoutRoutine routine = routineRepository.save(buildSeedRoutine(guest, seedExercises));
            sessionRepository.saveAll(buildSeedSessions(guest, routine, seedExercises));
        }

        String token = jwtUtil.generateToken(guest.getUsername());
        return new AuthResponse(token, guest.getUsername(), guest.getEmail(), true);
    }

    private User newGuestUser() {
        String username = USERNAME_PREFIX + randomSuffix();

        User guest = new User();
        guest.setUsername(username);
        guest.setEmail(username + EMAIL_DOMAIN);
        // 게스트는 토큰으로만 접근한다. 아무도 모르는 비밀번호라 폼 로그인은 불가능하다.
        guest.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        guest.setGuest(true);
        guest.setExpiresAt(LocalDateTime.now().plus(GUEST_TTL));
        return guest;
    }

    private String randomSuffix() {
        StringBuilder sb = new StringBuilder(SUFFIX_LENGTH);
        for (int i = 0; i < SUFFIX_LENGTH; i++) {
            sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }

    /**
     * 카테고리가 겹치지 않게 종목을 고른다. 운동 종류 데이터가 비어 있으면 빈 목록을 돌려주고
     * 시드를 건너뛴다 — 게스트 발급 자체는 실패하지 않는다.
     */
    private List<ExerciseType> pickSeedExercises() {
        Map<ExerciseType.ExerciseCategory, ExerciseType> byCategory = new LinkedHashMap<>();
        for (ExerciseType type : exerciseTypeRepository.findAll()) {
            byCategory.putIfAbsent(type.getCategory(), type);
        }

        return byCategory.values().stream()
            .sorted(Comparator.comparingInt(type -> {
                int index = SEED_CATEGORY_ORDER.indexOf(type.getCategory());
                return index < 0 ? SEED_CATEGORY_ORDER.size() : index;
            }))
            .limit(SEED_EXERCISE_COUNT)
            .toList();
    }

    private WorkoutRoutine buildSeedRoutine(User guest, List<ExerciseType> exercises) {
        WorkoutRoutine routine = new WorkoutRoutine();
        routine.setUser(guest);
        routine.setName("체험용 3분할 루틴");
        routine.setDescription("게스트 둘러보기용으로 미리 채워 둔 루틴입니다. 자유롭게 수정해 보세요.");
        routine.setDuration(60);
        routine.setDifficulty(WorkoutRoutine.Difficulty.BEGINNER);

        int sortOrder = 1;
        for (ExerciseType exercise : exercises) {
            RoutineExercise routineExercise = new RoutineExercise();
            routineExercise.setRoutine(routine);
            routineExercise.setExerciseType(exercise);
            routineExercise.setSortOrder(sortOrder++);
            routineExercise.setTargetSets(SEED_SETS_PER_EXERCISE);
            routineExercise.setTargetReps(10);
            routineExercise.setRestSeconds(90);
            routine.getRoutineExercises().add(routineExercise);
        }
        return routine;
    }

    private List<WorkoutSession> buildSeedSessions(User guest, WorkoutRoutine routine, List<ExerciseType> exercises) {
        List<WorkoutSession> sessions = new ArrayList<>();

        for (int i = 0; i < SEED_SESSION_DAYS_AGO.length; i++) {
            WorkoutSession session = new WorkoutSession();
            session.setUser(guest);
            session.setRoutine(routine);
            session.setDate(LocalDateTime.now().minusDays(SEED_SESSION_DAYS_AGO[i]).withHour(19).withMinute(0));
            session.setDuration(55);
            session.setNotes(i == 0 ? "체험용 샘플 기록입니다." : null);

            for (ExerciseType exercise : exercises) {
                for (int set = 1; set <= SEED_SETS_PER_EXERCISE; set++) {
                    ExerciseRecord record = new ExerciseRecord();
                    record.setSession(session);
                    record.setExerciseType(exercise);
                    record.setSetNumber(set);
                    record.setReps(10);
                    // 회차마다 2.5kg씩 올려 진행도·추정 1RM에 상승 추세가 남게 한다.
                    record.setWeight(40.0 + i * 2.5);
                    record.setRpe(8.0);
                    session.getExercisesPerformed().add(record);
                }
            }
            sessions.add(session);
        }
        return sessions;
    }
}
