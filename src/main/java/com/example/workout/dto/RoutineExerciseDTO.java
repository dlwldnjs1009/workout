package com.example.workout.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoutineExerciseDTO {

    @NotNull(message = "운동 종목은 필수 항목입니다.")
    private Long exerciseId;

    @Min(value = 1, message = "운동 순서는 1 이상이어야 합니다.")
    private Integer sortOrder;

    @NotNull(message = "목표 세트 수는 필수 항목입니다.")
    @Min(value = 1, message = "목표 세트 수는 1 이상이어야 합니다.")
    @Max(value = 20, message = "목표 세트 수는 20 이하여야 합니다.")
    private Integer targetSets;

    @NotNull(message = "목표 반복 수는 필수 항목입니다.")
    @Min(value = 1, message = "목표 반복 수는 1 이상이어야 합니다.")
    @Max(value = 100, message = "목표 반복 수는 100 이하여야 합니다.")
    private Integer targetReps;

    @Min(value = 0, message = "휴식 시간은 0초 이상이어야 합니다.")
    @Max(value = 3600, message = "휴식 시간은 1시간 이하여야 합니다.")
    private Integer restSeconds;
}
