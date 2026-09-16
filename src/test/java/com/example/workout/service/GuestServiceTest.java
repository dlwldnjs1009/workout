package com.example.workout.service;

import com.example.workout.dto.AuthResponse;
import com.example.workout.entity.ExerciseType;
import com.example.workout.entity.User;
import com.example.workout.entity.WorkoutRoutine;
import com.example.workout.entity.WorkoutSession;
import com.example.workout.repository.ExerciseTypeRepository;
import com.example.workout.repository.UserRepository;
import com.example.workout.repository.WorkoutRoutineRepository;
import com.example.workout.repository.WorkoutSessionRepository;
import com.example.workout.security.JwtUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("GuestService 테스트")
class GuestServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private ExerciseTypeRepository exerciseTypeRepository;
    @Mock
    private WorkoutRoutineRepository routineRepository;
    @Mock
    private WorkoutSessionRepository sessionRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtUtil jwtUtil;
    @InjectMocks
    private GuestService guestService;

    @Test
    @DisplayName("게스트 계정을 만료 시각과 함께 생성하고 토큰을 반환한다")
    void shouldCreateGuestUserWithExpiry() {
        stubSave();
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");
        when(jwtUtil.generateToken(anyString())).thenReturn("guest-token");
        when(exerciseTypeRepository.findAll()).thenReturn(List.of());

        AuthResponse response = guestService.createGuestSession();

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();

        assertThat(saved.getUsername()).startsWith("guest_");
        assertThat(saved.isGuest()).isTrue();
        assertThat(saved.getExpiresAt()).isAfter(LocalDateTime.now());
        assertThat(saved.getPassword()).isEqualTo("encoded");
        assertThat(response.getToken()).isEqualTo("guest-token");
        assertThat(response.getUsername()).isEqualTo(saved.getUsername());
    }

    @Test
    @DisplayName("매번 서로 다른 게스트 아이디를 발급한다")
    void shouldIssueDistinctUsernames() {
        stubSave();
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");
        when(jwtUtil.generateToken(anyString())).thenReturn("guest-token");
        when(exerciseTypeRepository.findAll()).thenReturn(List.of());

        AuthResponse first = guestService.createGuestSession();
        AuthResponse second = guestService.createGuestSession();

        assertThat(first.getUsername()).isNotEqualTo(second.getUsername());
    }

    @Test
    @DisplayName("운동 종류가 있으면 추천 루틴과 과거 세션을 시드한다")
    void shouldSeedRoutineAndSessions() {
        stubSave();
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");
        when(jwtUtil.generateToken(anyString())).thenReturn("guest-token");
        when(exerciseTypeRepository.findAll()).thenReturn(List.of(
            exerciseType(1L, "플랫 바벨 벤치 프레스", ExerciseType.ExerciseCategory.CHEST),
            exerciseType(2L, "바벨 로우", ExerciseType.ExerciseCategory.BACK),
            exerciseType(3L, "바벨 백스쿼트", ExerciseType.ExerciseCategory.LEGS)
        ));

        guestService.createGuestSession();

        ArgumentCaptor<WorkoutRoutine> routineCaptor = ArgumentCaptor.forClass(WorkoutRoutine.class);
        verify(routineRepository).save(routineCaptor.capture());
        WorkoutRoutine routine = routineCaptor.getValue();
        assertThat(routine.getRoutineExercises()).hasSize(3);
        assertThat(routine.getRoutineExercises())
            .extracting(re -> re.getSortOrder())
            .containsExactly(1, 2, 3);

        ArgumentCaptor<List<WorkoutSession>> sessionCaptor = ArgumentCaptor.forClass(List.class);
        verify(sessionRepository).saveAll(sessionCaptor.capture());
        List<WorkoutSession> sessions = sessionCaptor.getValue();
        assertThat(sessions).isNotEmpty();
        assertThat(sessions).allSatisfy(session -> {
            assertThat(session.getDate()).isBefore(LocalDateTime.now());
            assertThat(session.getExercisesPerformed()).isNotEmpty();
        });
    }

    @Test
    @DisplayName("운동 종류가 없으면 시드 없이 계정만 만든다")
    void shouldSkipSeedingWhenNoExerciseTypes() {
        stubSave();
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");
        when(jwtUtil.generateToken(anyString())).thenReturn("guest-token");
        when(exerciseTypeRepository.findAll()).thenReturn(List.of());

        AuthResponse response = guestService.createGuestSession();

        assertThat(response.getToken()).isEqualTo("guest-token");
        verify(routineRepository, never()).save(any());
        verify(sessionRepository, never()).saveAll(any());
    }

    private void stubSave() {
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private ExerciseType exerciseType(Long id, String name, ExerciseType.ExerciseCategory category) {
        ExerciseType type = new ExerciseType();
        type.setId(id);
        type.setName(name);
        type.setCategory(category);
        type.setMuscleGroup("테스트");
        return type;
    }
}
