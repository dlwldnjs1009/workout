package com.example.workout.service;

import com.example.workout.dto.RoutineExerciseDTO;
import com.example.workout.dto.WorkoutRoutineDTO;
import com.example.workout.entity.ExerciseType;
import com.example.workout.entity.User;
import com.example.workout.entity.WorkoutRoutine;
import com.example.workout.mapper.WorkoutRoutineMapper;
import com.example.workout.repository.ExerciseTypeRepository;
import com.example.workout.repository.UserRepository;
import com.example.workout.repository.WorkoutRoutineRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("WorkoutRoutineService 테스트")
class WorkoutRoutineServiceTest {

    @Mock
    private WorkoutRoutineRepository routineRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ExerciseTypeRepository exerciseRepository;
    @Mock
    private WorkoutRoutineMapper routineMapper;
    @InjectMocks
    private WorkoutRoutineService workoutRoutineService;

    @Test
    @DisplayName("운동별 목표와 입력 순서를 보존해 루틴을 생성한다")
    void shouldCreateRoutineWithStructuredExercisePlans() {
        User user = new User();
        user.setId(1L);
        ExerciseType squat = exercise(10L, "스쿼트");
        ExerciseType legPress = exercise(20L, "레그 프레스");

        WorkoutRoutineDTO request = new WorkoutRoutineDTO(
            null, "하체", "하체 루틴", 50, "BEGINNER",
            List.of(
                new RoutineExerciseDTO(20L, 1, 4, 12, 120),
                new RoutineExerciseDTO(10L, 2, 3, 8, 180)
            ),
            null, null
        );
        when(userRepository.findByUsername("tester")).thenReturn(Optional.of(user));
        when(exerciseRepository.findById(20L)).thenReturn(Optional.of(legPress));
        when(exerciseRepository.findById(10L)).thenReturn(Optional.of(squat));
        when(routineRepository.save(any(WorkoutRoutine.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(routineMapper.toDTO(any(WorkoutRoutine.class))).thenReturn(request);

        workoutRoutineService.createRoutine("tester", request);

        ArgumentCaptor<WorkoutRoutine> routineCaptor = ArgumentCaptor.forClass(WorkoutRoutine.class);
        org.mockito.Mockito.verify(routineRepository).save(routineCaptor.capture());
        WorkoutRoutine saved = routineCaptor.getValue();
        assertThat(saved.getRoutineExercises()).hasSize(2);
        assertThat(saved.getRoutineExercises())
            .extracting(plan -> plan.getExerciseType().getId())
            .containsExactly(20L, 10L);
        assertThat(saved.getRoutineExercises())
            .extracting(plan -> plan.getTargetSets())
            .containsExactly(4, 3);
        assertThat(saved.getRoutineExercises())
            .extracting(plan -> plan.getTargetReps())
            .containsExactly(12, 8);
    }

    @Test
    @DisplayName("이전 exerciseIds 요청은 3세트 10회 90초 기본값으로 변환한다")
    void shouldKeepLegacyExerciseIdsCompatible() {
        User user = new User();
        user.setId(1L);
        ExerciseType benchPress = exercise(10L, "벤치 프레스");
        WorkoutRoutineDTO request = new WorkoutRoutineDTO(
            null, "가슴", "기존 형식", 40, "BEGINNER", null, List.of(10L), null
        );
        when(userRepository.findByUsername("tester")).thenReturn(Optional.of(user));
        when(exerciseRepository.findById(10L)).thenReturn(Optional.of(benchPress));
        when(routineRepository.save(any(WorkoutRoutine.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(routineMapper.toDTO(any(WorkoutRoutine.class))).thenReturn(request);

        workoutRoutineService.createRoutine("tester", request);

        ArgumentCaptor<WorkoutRoutine> routineCaptor = ArgumentCaptor.forClass(WorkoutRoutine.class);
        org.mockito.Mockito.verify(routineRepository).save(routineCaptor.capture());
        var legacyPlan = routineCaptor.getValue().getRoutineExercises().getFirst();
        assertThat(legacyPlan.getTargetSets()).isEqualTo(3);
        assertThat(legacyPlan.getTargetReps()).isEqualTo(10);
        assertThat(legacyPlan.getRestSeconds()).isEqualTo(90);
    }

    private ExerciseType exercise(Long id, String name) {
        ExerciseType exercise = new ExerciseType();
        exercise.setId(id);
        exercise.setName(name);
        return exercise;
    }
}
