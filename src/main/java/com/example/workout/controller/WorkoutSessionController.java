package com.example.workout.controller;

import com.example.workout.dto.WorkoutDashboardDTO;
import com.example.workout.dto.WorkoutSessionDTO;
import com.example.workout.security.CurrentUsername;
import com.example.workout.service.WorkoutSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class WorkoutSessionController {
    private final WorkoutSessionService sessionService;

    @PostMapping
    public ResponseEntity<WorkoutSessionDTO> createSession(
            @CurrentUsername String username,
            @Valid @RequestBody WorkoutSessionDTO dto) {
        return ResponseEntity.ok(sessionService.createSession(username, dto));
    }

    @GetMapping
    public ResponseEntity<List<WorkoutSessionDTO>> getUserSessions(
            @CurrentUsername String username,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        if (startDate != null && endDate != null) {
            return ResponseEntity.ok(sessionService.getUserSessionsByDateRange(username, startDate, endDate));
        }
        return ResponseEntity.ok(sessionService.getUserSessions(username));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<WorkoutDashboardDTO> getWorkoutDashboard(
            @CurrentUsername String username,
            @RequestParam(defaultValue = "UTC") String tz) {
        return ResponseEntity.ok(sessionService.getWorkoutDashboard(username, tz));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkoutSessionDTO> getSessionById(
            @PathVariable Long id,
            @CurrentUsername String username) {
        return ResponseEntity.ok(sessionService.getSessionById(id, username));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(
            @PathVariable Long id,
            @CurrentUsername String username) {
        sessionService.deleteSession(id, username);
        return ResponseEntity.ok().build();
    }
}
