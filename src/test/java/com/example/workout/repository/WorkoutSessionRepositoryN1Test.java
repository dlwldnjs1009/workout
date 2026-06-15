package com.example.workout.repository;

import com.example.workout.entity.ExerciseRecord;
import com.example.workout.entity.ExerciseType;
import com.example.workout.entity.User;
import com.example.workout.entity.WorkoutSession;
import jakarta.persistence.EntityManager;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 세션 기간 조회 경로의 N+1 회귀 방지 테스트.
 *
 * getUserSessionsByDateRange -> findByUserIdAndDateBetweenOrderByDateDesc 결과를
 * WorkoutSessionMapper가 exercisesPerformed(+exerciseType)까지 매핑하므로,
 * fetch 전략이 없으면 세션 N개당 1 + N(+M) 쿼리가 발생한다.
 *
 * 쿼리 카운트는 Hibernate 레벨 동작이라 DB 종류와 무관 -> H2 + Statistics로 검증한다.
 */
@DataJpaTest
@TestPropertySource(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
@DisplayName("WorkoutSessionRepository 기간 조회 N+1")
class WorkoutSessionRepositoryN1Test {

    private static final int SESSION_COUNT = 10;
    private static final int RECORDS_PER_SESSION = 2;

    @Autowired
    private TestEntityManager testEntityManager;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private WorkoutSessionRepository sessionRepository;

    private Long userId;
    private LocalDateTime rangeStart;
    private LocalDateTime rangeEnd;

    @BeforeEach
    void seed() {
        User user = User.builder()
                .username("n1user")
                .email("n1user@example.com")
                .password("pw")
                .build();
        testEntityManager.persist(user);
        this.userId = user.getId();

        LocalDateTime base = LocalDateTime.of(2026, 1, 1, 10, 0);
        this.rangeStart = base.minusDays(1);
        this.rangeEnd = base.plusDays(SESSION_COUNT + 1);

        for (int s = 0; s < SESSION_COUNT; s++) {
            WorkoutSession session = new WorkoutSession();
            session.setUser(user);
            session.setDate(base.plusDays(s));
            session.setDuration(60);
            testEntityManager.persist(session);

            for (int r = 0; r < RECORDS_PER_SESSION; r++) {
                ExerciseType type = ExerciseType.builder()
                        .name("exercise-" + s + "-" + r)
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

        testEntityManager.flush();
        testEntityManager.clear();
    }

    @Test
    @DisplayName("기간 조회 + 레코드/운동종목 접근이 상수 쿼리로 끝나야 한다 (N+1 금지)")
    void dateRangeQueryShouldNotTriggerNPlusOne() {
        Statistics stats = entityManager.getEntityManagerFactory()
                .unwrap(SessionFactory.class)
                .getStatistics();
        stats.clear();

        List<WorkoutSession> sessions =
                sessionRepository.findByUserIdAndDateBetweenOrderByDateDesc(userId, rangeStart, rangeEnd);

        // WorkoutSessionMapper가 하는 접근을 그대로 재현: 컬렉션 + 레코드별 운동종목
        int touchedRecords = 0;
        for (WorkoutSession session : sessions) {
            for (ExerciseRecord record : session.getExercisesPerformed()) {
                record.getExerciseType().getName();
                touchedRecords++;
            }
        }

        long statementCount = stats.getPrepareStatementCount();
        System.out.println("[N+1 probe] sessions=" + sessions.size()
                + ", touchedRecords=" + touchedRecords
                + ", prepareStatementCount=" + statementCount);

        // 정확성: 중복 없는 세션 N개, 레코드 N*M개
        assertThat(sessions).hasSize(SESSION_COUNT);
        assertThat(touchedRecords).isEqualTo(SESSION_COUNT * RECORDS_PER_SESSION);

        // 핵심: fetch join이면 쿼리 1~2개. N+1이면 1 + N(+M)개.
        assertThat(statementCount)
                .as("기간 조회는 fetch join으로 상수 쿼리여야 한다")
                .isLessThanOrEqualTo(2);
    }

    @Test
    @DisplayName("페이징 리스트(ID 페이징 + findByIdIn)도 상수 쿼리여야 한다 (N+1 금지)")
    void paginatedListShouldNotTriggerNPlusOne() {
        org.springframework.data.domain.Page<Long> idPage =
                sessionRepository.findIdsByUserIdOrderByDateDesc(
                        userId, org.springframework.data.domain.PageRequest.of(0, SESSION_COUNT));

        Statistics stats = entityManager.getEntityManagerFactory()
                .unwrap(SessionFactory.class)
                .getStatistics();
        stats.clear();

        List<WorkoutSession> sessions = sessionRepository.findByIdIn(idPage.getContent());
        int touchedRecords = 0;
        for (WorkoutSession session : sessions) {
            for (ExerciseRecord record : session.getExercisesPerformed()) {
                record.getExerciseType().getName();
                touchedRecords++;
            }
        }

        long statementCount = stats.getPrepareStatementCount();
        System.out.println("[N+1 probe paginated] sessions=" + sessions.size()
                + ", touchedRecords=" + touchedRecords
                + ", prepareStatementCount=" + statementCount);

        assertThat(sessions).hasSize(SESSION_COUNT);
        assertThat(touchedRecords).isEqualTo(SESSION_COUNT * RECORDS_PER_SESSION);
        assertThat(statementCount)
                .as("findByIdIn은 fetch join으로 상수 쿼리여야 한다")
                .isLessThanOrEqualTo(1);
    }
}
