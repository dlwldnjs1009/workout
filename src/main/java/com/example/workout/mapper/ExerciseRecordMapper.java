package com.example.workout.mapper;

import com.example.workout.dto.ExerciseRecordDTO;
import com.example.workout.entity.ExerciseRecord;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ExerciseRecordMapper {

    @Mapping(source = "exerciseType.id", target = "exerciseId")
    @Mapping(source = "exerciseType.name", target = "exerciseName")
    ExerciseRecordDTO toDTO(ExerciseRecord record);

    List<ExerciseRecordDTO> toDTOList(List<ExerciseRecord> records);
}
