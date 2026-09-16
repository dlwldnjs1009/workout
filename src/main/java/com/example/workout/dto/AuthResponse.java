package com.example.workout.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String username;
    private String email;
    /** 체험용 임시 계정 여부. 클라이언트가 안내 배너를 띄우는 데 쓴다. */
    private boolean guest;
}
