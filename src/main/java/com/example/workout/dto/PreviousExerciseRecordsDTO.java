package com.example.workout.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
public class PreviousExerciseRecordsDTO {
    private Long exerciseId;
    private LocalDate sessionDate;
    private List<ExerciseRecordDTO> records;
}
