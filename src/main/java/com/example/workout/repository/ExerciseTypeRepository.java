package com.example.workout.repository;

import com.example.workout.entity.ExerciseType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExerciseTypeRepository extends JpaRepository<ExerciseType, Long> {
    List<ExerciseType> findByCategory(ExerciseType.ExerciseCategory category);
    List<ExerciseType> findByMuscleGroup(String muscleGroup);
}
