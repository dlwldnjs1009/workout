package com.example.workout.mapper;

import com.example.workout.dto.WorkoutSessionDTO;
import com.example.workout.entity.WorkoutSession;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Mapper(componentModel = "spring", uses = {ExerciseRecordMapper.class})
public interface WorkoutSessionMapper {

    @Mapping(source = "date", target = "date", qualifiedByName = "toLocalDate")
    @Mapping(source = "routine.id", target = "routineId")
    @Mapping(source = "exercisesPerformed", target = "exercisesPerformed")
    WorkoutSessionDTO toDTO(WorkoutSession session);

    List<WorkoutSessionDTO> toDTOList(List<WorkoutSession> sessions);

    @org.mapstruct.Named("toLocalDate")
    default LocalDate toLocalDate(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.toLocalDate() : null;
    }
}
