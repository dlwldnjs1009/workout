package com.example.workout.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    // Common
    INTERNAL_SERVER_ERROR("C001", "서버 내부 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_INPUT_VALUE("C002", "잘못된 입력값입니다.", HttpStatus.BAD_REQUEST),
    METHOD_NOT_ALLOWED("C003", "허용되지 않은 메서드입니다.", HttpStatus.METHOD_NOT_ALLOWED),

    // Auth
    UNAUTHORIZED("A001", "인증이 필요합니다.", HttpStatus.UNAUTHORIZED),
    ACCESS_DENIED("A002", "접근 권한이 없습니다.", HttpStatus.FORBIDDEN),
    INVALID_TOKEN("A003", "유효하지 않은 토큰입니다.", HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED("A004", "토큰이 만료되었습니다.", HttpStatus.UNAUTHORIZED),

    // User
    USER_NOT_FOUND("U001", "사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    DUPLICATE_USERNAME("U002", "이미 사용 중인 사용자명입니다.", HttpStatus.CONFLICT),
    DUPLICATE_EMAIL("U003", "이미 사용 중인 이메일입니다.", HttpStatus.CONFLICT),

    // Resource
    RESOURCE_NOT_FOUND("R001", "리소스를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    DUPLICATE_RESOURCE("R002", "이미 존재하는 리소스입니다.", HttpStatus.CONFLICT),

    // Workout
    WORKOUT_SESSION_NOT_FOUND("W001", "운동 세션을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    WORKOUT_ROUTINE_NOT_FOUND("W002", "운동 루틴을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    EXERCISE_NOT_FOUND("W003", "운동 종목을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

    // Diet
    DIET_SESSION_NOT_FOUND("D001", "식단 세션을 찾을 수 없습니다.", HttpStatus.NOT_FOUND);

    private final String code;
    private final String message;
    private final HttpStatus status;
}
