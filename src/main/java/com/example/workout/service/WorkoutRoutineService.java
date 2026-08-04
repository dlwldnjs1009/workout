package com.example.workout.service;

import com.example.workout.dto.RoutineExerciseDTO;
import com.example.workout.dto.WorkoutRoutineDTO;
import com.example.workout.entity.*;
import com.example.workout.mapper.WorkoutRoutineMapper;
import com.example.workout.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WorkoutRoutineService {
    private final WorkoutRoutineRepository routineRepository;
    private final UserRepository userRepository;
    private final ExerciseTypeRepository exerciseRepository;
    private final WorkoutRoutineMapper routineMapper;

    @Transactional
    public WorkoutRoutineDTO createRoutine(String username, WorkoutRoutineDTO dto) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        WorkoutRoutine routine = new WorkoutRoutine();
        routine.setUser(user);
        routine.setName(dto.getName());
        routine.setDescription(dto.getDescription());
        routine.setDuration(dto.getDuration());
        routine.setDifficulty(WorkoutRoutine.Difficulty.valueOf(dto.getDifficulty()));

        List<RoutineExerciseDTO> exercisePlans = resolveExercisePlans(dto);
        Set<Long> uniqueExerciseIds = new HashSet<>();
        List<RoutineExercise> routineExercises = new ArrayList<>();

        for (int index = 0; index < exercisePlans.size(); index++) {
            RoutineExerciseDTO exercisePlan = exercisePlans.get(index);
            if (!uniqueExerciseIds.add(exercisePlan.getExerciseId())) {
                throw new IllegalArgumentException("같은 운동은 루틴에 한 번만 추가할 수 있습니다.");
            }

            ExerciseType exercise = exerciseRepository.findById(exercisePlan.getExerciseId())
                .orElseThrow(() -> new RuntimeException("Exercise not found"));

            routineExercises.add(RoutineExercise.builder()
                .routine(routine)
                .exerciseType(exercise)
                .sortOrder(index + 1)
                .targetSets(exercisePlan.getTargetSets())
                .targetReps(exercisePlan.getTargetReps())
                .restSeconds(exercisePlan.getRestSeconds() != null ? exercisePlan.getRestSeconds() : 90)
                .build());
        }
        routine.setRoutineExercises(routineExercises);

        routine = routineRepository.save(routine);
        return routineMapper.toDTO(routine);
    }

    /**
     * exerciseIds만 보내는 기존 클라이언트도 기본 목표(3세트 x 10회, 90초 휴식)로 계속 동작시킨다.
     */
    private List<RoutineExerciseDTO> resolveExercisePlans(WorkoutRoutineDTO dto) {
        if (dto.getExercises() != null && !dto.getExercises().isEmpty()) {
            return dto.getExercises();
        }
        if (dto.getExerciseIds() == null || dto.getExerciseIds().isEmpty()) {
            throw new IllegalArgumentException("최소 하나의 운동을 추가해야 합니다.");
        }
        List<RoutineExerciseDTO> defaults = new ArrayList<>();
        for (int index = 0; index < dto.getExerciseIds().size(); index++) {
            defaults.add(new RoutineExerciseDTO(dto.getExerciseIds().get(index), index + 1, 3, 10, 90));
        }
        return defaults;
    }

    /**
     * 루틴 조회 (EntityGraph 적용으로 N+1 방지)
     */
    public List<WorkoutRoutineDTO> getUserRoutines(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        List<WorkoutRoutine> routines = routineRepository.findByUserIdWithExercises(user.getId());
        return routineMapper.toDTOList(routines);
    }

    /**
     * 페이지네이션 지원 루틴 조회
     */
    public Page<WorkoutRoutineDTO> getUserRoutines(String username, Pageable pageable) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return routineRepository.findByUserId(user.getId(), pageable)
            .map(routineMapper::toDTO);
    }

    @Transactional
    public void deleteRoutine(Long id, String username) {
        WorkoutRoutine routine = routineRepository.findByIdAndUser_Username(id, username)
            .orElseThrow(() -> new RuntimeException("Routine not found or access denied"));
        routineRepository.delete(routine);
    }
}
