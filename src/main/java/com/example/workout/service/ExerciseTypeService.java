package com.example.workout.service;

import com.example.workout.entity.ExerciseType;
import com.example.workout.repository.ExerciseTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExerciseTypeService {
    private final ExerciseTypeRepository exerciseRepository;

    @Cacheable(value = "exerciseTypes")
    public List<ExerciseType> getAllExercises() {
        return exerciseRepository.findAll();
    }

    @Cacheable(value = "exercisesByCategory", key = "#category.name()")
    public List<ExerciseType> getExercisesByCategory(ExerciseType.ExerciseCategory category) {
        return exerciseRepository.findByCategory(category);
    }
}
