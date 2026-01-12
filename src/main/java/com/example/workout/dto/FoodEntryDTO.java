package com.example.workout.dto;

import com.example.workout.entity.MealType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodEntryDTO {
    private Long id;
    private MealType mealType;
    private String foodName;
    private Integer calories;
    private Double protein;
    private Double carbs;
    private Double fat;
}
