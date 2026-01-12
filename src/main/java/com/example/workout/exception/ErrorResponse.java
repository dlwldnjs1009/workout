package com.example.workout.exception;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Builder
public class ErrorResponse {
    private final String code;
    private final String message;
    private final int status;
    private final LocalDateTime timestamp;
    private final Map<String, String> errors;

    public static ErrorResponse of(ErrorCode errorCode) {
        return ErrorResponse.builder()
            .code(errorCode.getCode())
            .message(errorCode.getMessage())
            .status(errorCode.getStatus().value())
            .timestamp(LocalDateTime.now())
            .build();
    }

    public static ErrorResponse of(ErrorCode errorCode, String customMessage) {
        return ErrorResponse.builder()
            .code(errorCode.getCode())
            .message(customMessage)
            .status(errorCode.getStatus().value())
            .timestamp(LocalDateTime.now())
            .build();
    }

    public static ErrorResponse of(ErrorCode errorCode, Map<String, String> errors) {
        return ErrorResponse.builder()
            .code(errorCode.getCode())
            .message(errorCode.getMessage())
            .status(errorCode.getStatus().value())
            .timestamp(LocalDateTime.now())
            .errors(errors)
            .build();
    }
}
