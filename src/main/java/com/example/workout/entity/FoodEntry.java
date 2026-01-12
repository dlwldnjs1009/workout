package com.example.workout.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Entity
@Table(name = "food_entries", indexes = {
    @Index(name = "idx_diet_session_id", columnList = "diet_session_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diet_session_id", nullable = false)
    private DietSession dietSession;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NotNull(message = "Meal type is required")
    private MealType mealType;

    @Column(nullable = false)
    @NotNull(message = "Food name is required")
    private String foodName;

    @Column(nullable = false)
    private Integer calories;

    private Double protein;
    private Double carbs;
    private Double fat;
}
