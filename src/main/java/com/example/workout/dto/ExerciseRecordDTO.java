package com.example.workout.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ExerciseRecordDTO {
    private Long id;

    @NotNull(message = "운동 종목은 필수 항목입니다.")
    private Long exerciseId;

    private String exerciseName;

    @NotNull(message = "세트 번호는 필수 항목입니다.")
    @Min(value = 1, message = "세트 번호는 최소 1이어야 합니다.")
    private Integer setNumber;

    @NotNull(message = "횟수는 필수 항목입니다.")
    @Min(value = 1, message = "횟수는 최소 1이어야 합니다.")
    private Integer reps;

    private Double weight;

    private Integer duration;
}
