package com.example.workout.mapper;

import com.example.workout.dto.WorkoutRoutineDTO;
import com.example.workout.dto.RoutineExerciseDTO;
import com.example.workout.entity.RoutineExercise;
import com.example.workout.entity.WorkoutRoutine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Collections;
import java.util.List;

@Mapper(componentModel = "spring")
public interface WorkoutRoutineMapper {

    @Mapping(source = "difficulty", target = "difficulty", qualifiedByName = "difficultyToString")
    @Mapping(source = "routineExercises", target = "exercises", qualifiedByName = "routineExercisesToDTOs")
    @Mapping(source = "routineExercises", target = "exerciseIds", qualifiedByName = "routineExercisesToIds")
    WorkoutRoutineDTO toDTO(WorkoutRoutine routine);

    List<WorkoutRoutineDTO> toDTOList(List<WorkoutRoutine> routines);

    @Named("difficultyToString")
    default String difficultyToString(WorkoutRoutine.Difficulty difficulty) {
        return difficulty != null ? difficulty.name() : null;
    }

    @Named("routineExercisesToDTOs")
    default List<RoutineExerciseDTO> routineExercisesToDTOs(List<RoutineExercise> routineExercises) {
        if (routineExercises == null) return Collections.emptyList();
        return routineExercises.stream()
            .map(routineExercise -> new RoutineExerciseDTO(
                routineExercise.getExerciseType().getId(),
                routineExercise.getSortOrder(),
                routineExercise.getTargetSets(),
                routineExercise.getTargetReps(),
                routineExercise.getRestSeconds()
            ))
            .toList();
    }

    @Named("routineExercisesToIds")
    default List<Long> routineExercisesToIds(List<RoutineExercise> routineExercises) {
        if (routineExercises == null) return Collections.emptyList();
        return routineExercises.stream()
            .map(routineExercise -> routineExercise.getExerciseType().getId())
            .toList();
    }
}
