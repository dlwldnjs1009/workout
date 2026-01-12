package com.example.workout.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 현재 인증된 사용자의 username을 메서드 파라미터로 주입받기 위한 어노테이션.
 *
 * 사용 예:
 * <pre>
 * public ResponseEntity<?> getProfile(@CurrentUsername String username) {
 *     // username 사용
 * }
 * </pre>
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentUsername {
}
