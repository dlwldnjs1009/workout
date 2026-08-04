package com.example.workout.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class ExerciseProgressPointDTO {
    private Long sessionId;
    private LocalDate date;
    private Double estimatedOneRepMax;
    private Double maxWeight;
    private Double volume;
}
