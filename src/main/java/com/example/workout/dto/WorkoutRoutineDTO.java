package com.example.workout.dto;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WorkoutRoutineDTO {
    private Long id;
    private String name;
    private String description;
    private Integer duration;
    private String difficulty;
    /**
     * 새 루틴 계약. 순서와 목표 세트/횟수/휴식 시간을 포함한다.
     */
    @Valid
    private List<RoutineExerciseDTO> exercises;

    /**
     * 이전 클라이언트 호환용 필드. 응답에서는 exercises에서 파생해 제공한다.
     */
    private List<Long> exerciseIds;
    private LocalDateTime createdAt;
}
