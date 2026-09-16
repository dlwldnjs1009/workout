package com.example.workout.controller;

import com.example.workout.dto.*;
import com.example.workout.exception.BusinessException;
import com.example.workout.exception.ErrorCode;
import com.example.workout.security.GuestRateLimiter;
import com.example.workout.service.AuthService;
import com.example.workout.service.GuestService;
import jakarta.servlet.http.HttpServletRequest;
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
    private final GuestRateLimiter guestRateLimiter;

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
    public ResponseEntity<AuthResponse> guest(HttpServletRequest request) {
        if (!guestRateLimiter.tryAcquire(clientKey(request))) {
            throw new BusinessException(ErrorCode.GUEST_RATE_LIMITED);
        }
        return ResponseEntity.ok(guestService.createGuestSession());
    }

    /**
     * nginx가 X-Real-IP를 매 요청 덮어쓰므로 클라이언트가 위조할 수 없다.
     * X-Forwarded-For는 클라이언트 값에 덧붙는 구조라 신뢰하지 않는다.
     */
    private String clientKey(HttpServletRequest request) {
        String realIp = request.getHeader("X-Real-IP");
        return (realIp != null && !realIp.isBlank()) ? realIp : request.getRemoteAddr();
    }
}
