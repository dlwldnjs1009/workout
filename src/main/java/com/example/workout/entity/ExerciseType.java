package com.example.workout.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "exercise_types", indexes = {
    @Index(name = "idx_category", columnList = "category"),
    @Index(name = "idx_muscle_group", columnList = "muscle_group")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExerciseType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    @NotBlank(message = "Exercise name is required")
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExerciseCategory category;

    @Column(nullable = false)
    private String muscleGroup;

    private String description;

    @JsonIgnore
    @OneToMany(mappedBy = "exerciseType")
    private Set<ExerciseRecord> records = new HashSet<>();

    public enum ExerciseCategory {
        CHEST, BACK, LEGS, ABS, ARMS, SHOULDERS, CARDIO, FLEXIBILITY, BALANCE
    }
}
