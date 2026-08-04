package com.example.workout.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProgressionSuggestionDTO {
    private String type;
    private Double recommendedWeight;
    private String message;
}
