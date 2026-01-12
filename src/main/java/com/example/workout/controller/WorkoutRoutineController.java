package com.example.workout.controller;

import com.example.workout.dto.WorkoutRoutineDTO;
import com.example.workout.security.CurrentUsername;
import com.example.workout.service.WorkoutRoutineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routines")
@RequiredArgsConstructor
public class WorkoutRoutineController {
    private final WorkoutRoutineService routineService;

    @PostMapping
    public ResponseEntity<WorkoutRoutineDTO> createRoutine(
            @CurrentUsername String username,
            @Valid @RequestBody WorkoutRoutineDTO dto) {
        return ResponseEntity.ok(routineService.createRoutine(username, dto));
    }

    @GetMapping
    public ResponseEntity<List<WorkoutRoutineDTO>> getUserRoutines(
            @CurrentUsername String username) {
        return ResponseEntity.ok(routineService.getUserRoutines(username));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoutine(
            @PathVariable Long id,
            @CurrentUsername String username) {
        routineService.deleteRoutine(id, username);
        return ResponseEntity.noContent().build();
    }
}
