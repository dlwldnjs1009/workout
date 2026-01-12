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
public class DietSessionDTO {
    private Long id;
    private LocalDate date;
    private String notes;
    private List<FoodEntryDTO> foodEntries;
    private Long userId;
}
