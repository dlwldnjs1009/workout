package com.example.workout.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutDashboardDTO {
    private Double totalVolume;
    private Long totalWorkouts;
    private Long monthlyWorkouts;
    private List<WorkoutSessionDTO> recentSessions;
    private List<VolumeDataPointDTO> volumeChartData;
    private LocalDate heatmapStartDate;
    private List<Integer> heatmapLevels;
}
