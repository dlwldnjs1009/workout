package com.example.workout.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DietDashboardDTO {
    private Integer calories;
    private Integer protein;
    private Integer carbs;
    private Integer fat;
    private boolean hasData;
}
