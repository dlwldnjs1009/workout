package com.example.workout.service;

import com.example.workout.dto.WorkoutDashboardDTO;
import com.example.workout.entity.ExerciseRecord;
import com.example.workout.entity.ExerciseType;
import com.example.workout.entity.User;
import com.example.workout.entity.WorkoutSession;
import com.example.workout.mapper.ExerciseRecordMapperImpl;
import com.example.workout.mapper.WorkoutSessionMapperImpl;
import jakarta.persistence.EntityManager;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 대시보드 최근 세션 경로의 N+1 회귀 방지 테스트.
 * 최근 세션 수(1개 vs 3개)가 달라도 getWorkoutDashboard의 쿼리 수가 세션 수에 비례해 늘지 않아야 한다.
 */
@DataJpaTest
@Import({WorkoutSessionService.class, WorkoutSessionMapperImpl.class, ExerciseRecordMapperImpl.class})
@TestPropertySource(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
@DisplayName("WorkoutSessionService 대시보드 N+1")
class WorkoutSessionServiceN1Test {

    private static final int RECORDS_PER_SESSION = 2;

    @Autowired
    private TestEntityManager testEntityManager;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private WorkoutSessionService workoutSessionService;

    @Test
    @DisplayName("최근 세션 수가 늘어도 대시보드 쿼리 수는 늘지 않는다")
    void dashboardQueryCountShouldNotGrowWithRecentSessions() {
        seedUser("one-session", 1);
        seedUser("three-sessions", 3);
        testEntityManager.flush();

        long oneSessionStatements = countDashboardStatements("one-session");
        long threeSessionStatements = countDashboardStatements("three-sessions");

        System.out.println("[N+1 probe dashboard] one=" + oneSessionStatements
                + ", three=" + threeSessionStatements);

        // 페이지가 가득 차면(3개) Page<Long>이 total count 쿼리를 1회 더 실행한다. 세션당 쿼리는 허용하지 않는다.
        assertThat(threeSessionStatements)
                .as("최근 세션 수가 늘어도 쿼리 수는 count 쿼리 1회 이상 늘지 않아야 한다")
                .isLessThanOrEqualTo(oneSessionStatements + 1);
    }

    private long countDashboardStatements(String username) {
        testEntityManager.clear();
        Statistics stats = entityManager.getEntityManagerFactory()
                .unwrap(SessionFactory.class)
                .getStatistics();
        stats.clear();

        WorkoutDashboardDTO dashboard = workoutSessionService.getWorkoutDashboard(username, "Asia/Seoul");

        assertThat(dashboard.getRecentSessions()).isNotEmpty();
        dashboard.getRecentSessions().forEach(session ->
                assertThat(session.getExercisesPerformed()).hasSize(RECORDS_PER_SESSION));
        return stats.getPrepareStatementCount();
    }

    private void seedUser(String username, int sessionCount) {
        User user = User.builder()
                .username(username)
                .email(username + "@example.com")
                .password("pw")
                .build();
        testEntityManager.persist(user);

        LocalDateTime base = LocalDateTime.now().minusDays(sessionCount);
        for (int s = 0; s < sessionCount; s++) {
            WorkoutSession session = new WorkoutSession();
            session.setUser(user);
            session.setDate(base.plusDays(s));
            session.setDuration(60);
            testEntityManager.persist(session);

            for (int r = 0; r < RECORDS_PER_SESSION; r++) {
                ExerciseType type = ExerciseType.builder()
                        .name(username + "-" + s + "-" + r)
                        .category(ExerciseType.ExerciseCategory.CHEST)
                        .muscleGroup("chest")
                        .build();
                testEntityManager.persist(type);

                ExerciseRecord record = new ExerciseRecord();
                record.setSession(session);
                record.setExerciseType(type);
                record.setSetNumber(r + 1);
                record.setReps(10);
                record.setWeight(50.0);
                testEntityManager.persist(record);
            }
        }
    }
}
