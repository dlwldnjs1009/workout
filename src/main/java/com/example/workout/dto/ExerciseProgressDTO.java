package com.example.workout.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ExerciseProgressDTO {
    private Long exerciseId;
    private String exerciseName;
    private Double currentEstimatedOneRepMax;
    private Double bestEstimatedOneRepMax;
    private Double bestWeight;
    private boolean newPersonalRecord;
    private ProgressionSuggestionDTO suggestion;
    private List<ExerciseProgressPointDTO> points;
}
