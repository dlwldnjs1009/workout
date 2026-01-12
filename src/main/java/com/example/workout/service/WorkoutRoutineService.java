package com.example.workout.service;

import com.example.workout.dto.WorkoutRoutineDTO;
import com.example.workout.entity.*;
import com.example.workout.mapper.WorkoutRoutineMapper;
import com.example.workout.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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

        Set<ExerciseType> exercises = new HashSet<>();
        for (Long exerciseId : dto.getExerciseIds()) {
            ExerciseType exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new RuntimeException("Exercise not found"));
            exercises.add(exercise);
        }
        routine.setExercises(exercises);

        routine = routineRepository.save(routine);
        return routineMapper.toDTO(routine);
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
