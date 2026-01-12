package com.example.workout.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@AllArgsConstructor
public class WorkoutRoutineDTO {
    private Long id;
    private String name;
    private String description;
    private Integer duration;
    private String difficulty;
    private Set<Long> exerciseIds;
    private LocalDateTime createdAt;
}
