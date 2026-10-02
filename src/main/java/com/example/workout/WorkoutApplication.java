package com.example.workout;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class WorkoutApplication {

	public static void main(String[] args) {
		// JDBC serverTimezone과 다르면 Connector/J가 DATETIME을 옮겨 저장한다. DataSource 생성 전에 맞춘다.
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
		SpringApplication.run(WorkoutApplication.class, args);
	}

}
