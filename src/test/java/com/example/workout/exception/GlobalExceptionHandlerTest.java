package com.example.workout.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("로그인 인증 실패(BadCredentials)는 500이 아니라 401과 한국어 메시지로 응답한다")
    void authenticationFailureReturns401() {
        ResponseEntity<ErrorResponse> response =
            handler.handleAuthenticationException(new BadCredentialsException("Bad credentials"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        ErrorResponse body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getStatus()).isEqualTo(401);
        assertThat(body.getCode()).isEqualTo("A005");
        assertThat(body.getMessage()).isEqualTo("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
}
