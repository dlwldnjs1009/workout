package com.example.workout.controller;

import com.example.workout.entity.UserProfile;
import com.example.workout.security.CurrentUsername;
import com.example.workout.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/profile")
@RequiredArgsConstructor
public class UserProfileController {
    private final UserProfileService userProfileService;

    @GetMapping
    public ResponseEntity<UserProfile> getProfile(@CurrentUsername String username) {
        return ResponseEntity.ok(userProfileService.getProfile(username));
    }

    @PutMapping
    public ResponseEntity<UserProfile> updateProfile(
            @CurrentUsername String username,
            @RequestBody UserProfile profile) {
        return ResponseEntity.ok(userProfileService.updateProfile(username, profile));
    }
}
