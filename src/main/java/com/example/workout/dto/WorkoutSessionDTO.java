package com.example.workout.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
public class WorkoutSessionDTO {
    private Long id;

    @NotNull(message = "운동 날짜는 필수 항목입니다.")
    private LocalDate date;

    private Integer duration;

    private String notes;

    private Long routineId;

    @NotEmpty(message = "최소 하나의 운동을 추가해야 합니다.")
    private List<ExerciseRecordDTO> exercisesPerformed;
}
