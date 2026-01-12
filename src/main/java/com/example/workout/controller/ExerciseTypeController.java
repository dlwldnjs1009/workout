package com.example.workout.controller;

import com.example.workout.entity.ExerciseType;
import com.example.workout.service.ExerciseTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
public class ExerciseTypeController {
    private final ExerciseTypeService exerciseService;

    @GetMapping
    public ResponseEntity<List<ExerciseType>> getAllExercises() {
        return ResponseEntity.ok(exerciseService.getAllExercises());
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<ExerciseType>> getExercisesByCategory(
            @PathVariable ExerciseType.ExerciseCategory category) {
        return ResponseEntity.ok(exerciseService.getExercisesByCategory(category));
    }
}
