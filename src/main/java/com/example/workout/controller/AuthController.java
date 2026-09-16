package com.example.workout.controller;

import com.example.workout.dto.*;
import com.example.workout.service.AuthService;
import com.example.workout.service.GuestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final GuestService guestService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * 회원가입 없이 둘러볼 수 있는 임시 계정을 발급한다.
     * 계정마다 데이터가 격리되며 GuestService.GUEST_TTL 이후 자동 삭제된다.
     */
    @PostMapping("/guest")
    public ResponseEntity<AuthResponse> guest() {
        return ResponseEntity.ok(guestService.createGuestSession());
    }
}
