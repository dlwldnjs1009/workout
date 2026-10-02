package com.example.workout;

import com.example.workout.dto.WorkoutDashboardDTO;
import com.example.workout.entity.User;
import com.example.workout.entity.WorkoutSession;
import com.example.workout.repository.UserRepository;
import com.example.workout.repository.WorkoutSessionRepository;
import com.example.workout.service.WorkoutSessionService;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.TimeZone;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 운영 backend 컨테이너는 TZ 설정 없이 UTC로 뜨고, JDBC 연결은 serverTimezone=Asia/Seoul이다.
 * 두 timezone이 다르면 Connector/J가 DATETIME을 옮겨 저장하고, DB 안에서 날짜를 자르는 집계가 그 값을 그대로 본다.
 *
 * 운영과 같은 조건(UTC JVM + serverTimezone=Asia/Seoul)에서 main 기동 경로를 거쳐 검증한다.
 * 드라이버 동작이 원인이라 H2로는 재현되지 않으므로 MySQL 컨테이너를 쓴다.
 */
@SpringBootTest(useMainMethod = SpringBootTest.UseMainMethod.ALWAYS)
@Testcontainers
@DisplayName("대시보드 날짜 timezone 통합 테스트")
class DashboardTimeZoneIntegrationTest {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final TimeZone ORIGINAL_TIME_ZONE = TimeZone.getDefault();

    static {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    }

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0")
            .withUrlParam("serverTimezone", "Asia/Seoul");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.datasource.driver-class-name", MYSQL::getDriverClassName);
    }

    @AfterAll
    static void restoreTimeZone() {
        TimeZone.setDefault(ORIGINAL_TIME_ZONE);
    }

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkoutSessionRepository sessionRepository;

    @Autowired
    private WorkoutSessionService sessionService;

    @Test
    @DisplayName("KST 저녁에 한 운동이 히트맵에서 같은 날짜 칸에 표시된다")
    void heatmapShowsEveningSessionOnSameDay() {
        LocalDate workoutDay = LocalDate.now(KST).minusDays(3);
        saveSession("heatmap-user", workoutDay, 20);

        WorkoutDashboardDTO dashboard = sessionService.getWorkoutDashboard("heatmap-user", "Asia/Seoul");

        int index = (int) ChronoUnit.DAYS.between(dashboard.getHeatmapStartDate(), workoutDay);
        assertThat(dashboard.getHeatmapLevels().get(index)).isEqualTo(1);
        assertThat(dashboard.getHeatmapLevels().get(index + 1)).isZero();
    }

    @Test
    @DisplayName("KST 저녁에 한 운동이 볼륨 차트에서 같은 날짜로 표시된다")
    void volumeChartShowsEveningSessionOnSameDay() {
        LocalDate workoutDay = LocalDate.now(KST).minusDays(3);
        saveSession("volume-user", workoutDay, 20);

        WorkoutDashboardDTO dashboard = sessionService.getWorkoutDashboard("volume-user", "Asia/Seoul");

        assertThat(dashboard.getVolumeChartData())
                .singleElement()
                .satisfies(point -> assertThat(point.getDate())
                        .isEqualTo(workoutDay.format(DateTimeFormatter.ofPattern("MM.dd"))));
    }

    private void saveSession(String username, LocalDate day, int hour) {
        User user = userRepository.save(User.builder()
                .username(username)
                .email(username + "@example.com")
                .password("pw")
                .build());
        WorkoutSession session = new WorkoutSession();
        session.setUser(user);
        session.setDate(day.atTime(hour, 0));
        session.setDuration(60);
        sessionRepository.save(session);
    }
}
