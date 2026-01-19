package com.example.workout.controller;

import com.example.workout.dto.DietDashboardDTO;
import com.example.workout.dto.DietSessionDTO;
import com.example.workout.security.CurrentUsername;
import com.example.workout.service.DietSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/diet-sessions")
@RequiredArgsConstructor
public class DietSessionController {

    private final DietSessionService dietSessionService;

    @GetMapping
    public ResponseEntity<List<DietSessionDTO>> getAllDietSessions(
            @CurrentUsername String username) {
        return ResponseEntity.ok(dietSessionService.getAllDietSessions(username));
    }

    /**
     * 특정 날짜의 식단 조회 (단건 조회로 네트워크/DB 부하 감소)
     * 미존재 시 204 No Content 반환 (null payload 방지)
     */
    @GetMapping("/by-date")
    public ResponseEntity<DietSessionDTO> getDietSessionByDate(
            @CurrentUsername String username,
            @RequestParam String date) {
        return dietSessionService.getDietSessionByDate(username, date)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/today")
    public ResponseEntity<DietDashboardDTO> getTodayDietSummary(
            @CurrentUsername String username,
            @RequestParam(defaultValue = "UTC") String tz) {
        return ResponseEntity.ok(dietSessionService.getTodayDietSummary(username, tz));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DietSessionDTO> getDietSession(
            @PathVariable Long id,
            @CurrentUsername String username) {
        return ResponseEntity.ok(dietSessionService.getDietSession(id, username));
    }

    @PostMapping
    public ResponseEntity<DietSessionDTO> createDietSession(
            @RequestBody DietSessionDTO dietSessionDTO,
            @CurrentUsername String username) {
        return ResponseEntity.ok(dietSessionService.createDietSession(dietSessionDTO, username));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDietSession(
            @PathVariable Long id,
            @CurrentUsername String username) {
        dietSessionService.deleteDietSession(id, username);
        return ResponseEntity.noContent().build();
    }
}
