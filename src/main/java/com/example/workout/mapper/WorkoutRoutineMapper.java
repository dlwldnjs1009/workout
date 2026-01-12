package com.example.workout.mapper;

import com.example.workout.dto.WorkoutRoutineDTO;
import com.example.workout.entity.ExerciseType;
import com.example.workout.entity.WorkoutRoutine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface WorkoutRoutineMapper {

    @Mapping(source = "difficulty", target = "difficulty", qualifiedByName = "difficultyToString")
    @Mapping(source = "exercises", target = "exerciseIds", qualifiedByName = "exercisesToIds")
    WorkoutRoutineDTO toDTO(WorkoutRoutine routine);

    List<WorkoutRoutineDTO> toDTOList(List<WorkoutRoutine> routines);

    @Named("difficultyToString")
    default String difficultyToString(WorkoutRoutine.Difficulty difficulty) {
        return difficulty != null ? difficulty.name() : null;
    }

    @Named("exercisesToIds")
    default Set<Long> exercisesToIds(Set<ExerciseType> exercises) {
        if (exercises == null) return null;
        return exercises.stream()
            .map(ExerciseType::getId)
            .collect(Collectors.toSet());
    }
}
