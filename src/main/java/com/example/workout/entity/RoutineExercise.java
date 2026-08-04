package com.example.workout.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "routine_exercises", uniqueConstraints = {
    @UniqueConstraint(name = "uk_routine_exercise", columnNames = {"routine_id", "exercise_id"})
}, indexes = {
    @Index(name = "idx_routine_exercise_order", columnList = "routine_id, sort_order")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoutineExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "routine_id", nullable = false)
    private WorkoutRoutine routine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private ExerciseType exerciseType;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "target_sets", nullable = false)
    private Integer targetSets;

    @Column(name = "target_reps", nullable = false)
    private Integer targetReps;

    @Column(name = "rest_seconds", nullable = false)
    private Integer restSeconds;
}
