package com.example.workout.service;

import com.example.workout.dto.WorkoutDashboardDTO;
import com.example.workout.dto.WorkoutSessionDTO;
import com.example.workout.entity.User;
import com.example.workout.entity.WorkoutSession;
import com.example.workout.exception.UserNotFoundException;
import com.example.workout.mapper.WorkoutSessionMapper;
import com.example.workout.repository.ExerciseRecordRepository;
import com.example.workout.repository.ExerciseTypeRepository;
import com.example.workout.repository.UserRepository;
import com.example.workout.repository.WorkoutSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WorkoutSessionService 테스트")
class WorkoutSessionServiceTest {

    @Mock
    private WorkoutSessionRepository sessionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ExerciseTypeRepository exerciseTypeRepository;

    @Mock
    private ExerciseRecordRepository exerciseRecordRepository;

    @Mock
    private WorkoutSessionMapper sessionMapper;

    @InjectMocks
    private WorkoutSessionService workoutSessionService;

    private User testUser;
    private static final String TEST_USERNAME = "testuser";
    private static final String TEST_TIMEZONE = "Asia/Seoul";

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername(TEST_USERNAME);
    }

    @Nested
    @DisplayName("getWorkoutDashboard 메서드")
    class GetWorkoutDashboard {

        @Test
        @DisplayName("사용자를 찾을 수 없으면 UserNotFoundException 발생")
        void shouldThrowWhenUserNotFound() {
            when(userRepository.findByUsername(TEST_USERNAME)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> workoutSessionService.getWorkoutDashboard(TEST_USERNAME, TEST_TIMEZONE))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining(TEST_USERNAME);
        }

        @Test
        @DisplayName("운동 기록이 없으면 기본값 반환")
        void shouldReturnDefaultValuesWhenNoWorkouts() {
            when(userRepository.findByUsername(TEST_USERNAME)).thenReturn(Optional.of(testUser));
            when(sessionRepository.sumTotalVolumeByUserId(testUser.getId())).thenReturn(null);
            when(sessionRepository.countByUserId(testUser.getId())).thenReturn(0L);
            when(sessionRepository.countByUserIdAndDateAfter(eq(testUser.getId()), any())).thenReturn(0L);
            when(sessionRepository.findRecentByUserId(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());
            when(sessionRepository.findRecentSessionVolumes(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());
            when(sessionRepository.countSessionsByDate(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());

            WorkoutDashboardDTO result = workoutSessionService.getWorkoutDashboard(TEST_USERNAME, TEST_TIMEZONE);

            assertThat(result.getTotalVolume()).isEqualTo(0.0);
            assertThat(result.getTotalWorkouts()).isEqualTo(0L);
            assertThat(result.getMonthlyWorkouts()).isEqualTo(0L);
            assertThat(result.getRecentSessions()).isEmpty();
            assertThat(result.getVolumeChartData()).isEmpty();
            assertThat(result.getHeatmapLevels()).hasSize(365);
            assertThat(result.getHeatmapLevels()).allMatch(level -> level == 0);
        }

        @Test
        @DisplayName("총 볼륨 정확히 계산")
        void shouldCalculateTotalVolumeCorrectly() {
            double expectedVolume = 15000.0;
            when(userRepository.findByUsername(TEST_USERNAME)).thenReturn(Optional.of(testUser));
            when(sessionRepository.sumTotalVolumeByUserId(testUser.getId())).thenReturn(expectedVolume);
            when(sessionRepository.countByUserId(testUser.getId())).thenReturn(10L);
            when(sessionRepository.countByUserIdAndDateAfter(eq(testUser.getId()), any())).thenReturn(5L);
            when(sessionRepository.findRecentByUserId(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());
            when(sessionRepository.findRecentSessionVolumes(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());
            when(sessionRepository.countSessionsByDate(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());

            WorkoutDashboardDTO result = workoutSessionService.getWorkoutDashboard(TEST_USERNAME, TEST_TIMEZONE);

            assertThat(result.getTotalVolume()).isEqualTo(expectedVolume);
            assertThat(result.getTotalWorkouts()).isEqualTo(10L);
            assertThat(result.getMonthlyWorkouts()).isEqualTo(5L);
        }

        @Test
        @DisplayName("볼륨 차트 데이터 역순 정렬")
        void shouldReverseVolumeChartData() {
            LocalDateTime date1 = LocalDateTime.of(2024, 1, 10, 10, 0);
            LocalDateTime date2 = LocalDateTime.of(2024, 1, 9, 10, 0);
            LocalDateTime date3 = LocalDateTime.of(2024, 1, 8, 10, 0);

            List<Object[]> volumeData = Arrays.asList(
                new Object[]{date1, 1000.0},
                new Object[]{date2, 800.0},
                new Object[]{date3, 600.0}
            );

            when(userRepository.findByUsername(TEST_USERNAME)).thenReturn(Optional.of(testUser));
            when(sessionRepository.sumTotalVolumeByUserId(testUser.getId())).thenReturn(2400.0);
            when(sessionRepository.countByUserId(testUser.getId())).thenReturn(3L);
            when(sessionRepository.countByUserIdAndDateAfter(eq(testUser.getId()), any())).thenReturn(3L);
            when(sessionRepository.findRecentByUserId(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());
            when(sessionRepository.findRecentSessionVolumes(eq(testUser.getId()), any())).thenReturn(volumeData);
            when(sessionRepository.countSessionsByDate(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());

            WorkoutDashboardDTO result = workoutSessionService.getWorkoutDashboard(TEST_USERNAME, TEST_TIMEZONE);

            assertThat(result.getVolumeChartData()).hasSize(3);
            assertThat(result.getVolumeChartData().get(0).getVolume()).isEqualTo(600.0);
            assertThat(result.getVolumeChartData().get(1).getVolume()).isEqualTo(800.0);
            assertThat(result.getVolumeChartData().get(2).getVolume()).isEqualTo(1000.0);
        }
    }

    @Nested
    @DisplayName("Heatmap 레벨 계산")
    class HeatmapLevelCalculation {

        @Test
        @DisplayName("운동 횟수에 따른 레벨 매핑: 0->0, 1->1, 2->2, 3+->3")
        void shouldMapCountsToLevelsCorrectly() {
            ZoneId zoneId = ZoneId.of(TEST_TIMEZONE);
            LocalDate today = LocalDate.now(zoneId);
            LocalDate startDate = today.minusDays(364);

            LocalDate date0 = startDate.plusDays(10);
            LocalDate date1 = startDate.plusDays(20);
            LocalDate date2 = startDate.plusDays(30);
            LocalDate date3 = startDate.plusDays(40);
            LocalDate date5 = startDate.plusDays(50);

            List<Object[]> dateCounts = Arrays.asList(
                new Object[]{date1, 1L},
                new Object[]{date2, 2L},
                new Object[]{date3, 3L},
                new Object[]{date5, 5L}
            );

            when(userRepository.findByUsername(TEST_USERNAME)).thenReturn(Optional.of(testUser));
            when(sessionRepository.sumTotalVolumeByUserId(testUser.getId())).thenReturn(0.0);
            when(sessionRepository.countByUserId(testUser.getId())).thenReturn(0L);
            when(sessionRepository.countByUserIdAndDateAfter(eq(testUser.getId()), any())).thenReturn(0L);
            when(sessionRepository.findRecentByUserId(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());
            when(sessionRepository.findRecentSessionVolumes(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());
            when(sessionRepository.countSessionsByDate(eq(testUser.getId()), any())).thenReturn(dateCounts);

            WorkoutDashboardDTO result = workoutSessionService.getWorkoutDashboard(TEST_USERNAME, TEST_TIMEZONE);

            List<Integer> levels = result.getHeatmapLevels();
            assertThat(levels).hasSize(365);

            assertThat(levels.get(10)).isEqualTo(0);
            assertThat(levels.get(20)).isEqualTo(1);
            assertThat(levels.get(30)).isEqualTo(2);
            assertThat(levels.get(40)).isEqualTo(3);
            assertThat(levels.get(50)).isEqualTo(3);
        }

        @Test
        @DisplayName("히트맵 시작 날짜는 364일 전")
        void shouldSetCorrectHeatmapStartDate() {
            when(userRepository.findByUsername(TEST_USERNAME)).thenReturn(Optional.of(testUser));
            when(sessionRepository.sumTotalVolumeByUserId(testUser.getId())).thenReturn(0.0);
            when(sessionRepository.countByUserId(testUser.getId())).thenReturn(0L);
            when(sessionRepository.countByUserIdAndDateAfter(eq(testUser.getId()), any())).thenReturn(0L);
            when(sessionRepository.findRecentByUserId(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());
            when(sessionRepository.findRecentSessionVolumes(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());
            when(sessionRepository.countSessionsByDate(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());

            WorkoutDashboardDTO result = workoutSessionService.getWorkoutDashboard(TEST_USERNAME, TEST_TIMEZONE);

            ZoneId zoneId = ZoneId.of(TEST_TIMEZONE);
            LocalDate expectedStartDate = LocalDate.now(zoneId).minusDays(364);
            assertThat(result.getHeatmapStartDate()).isEqualTo(expectedStartDate);
        }
    }

    @Nested
    @DisplayName("최근 세션 조회")
    class RecentSessions {

        @Test
        @DisplayName("최대 3개의 최근 세션 반환")
        void shouldReturnUpToThreeRecentSessions() {
            WorkoutSession session1 = createTestSession(1L, LocalDateTime.now());
            WorkoutSession session2 = createTestSession(2L, LocalDateTime.now().minusDays(1));
            WorkoutSession session3 = createTestSession(3L, LocalDateTime.now().minusDays(2));
            List<WorkoutSession> sessions = Arrays.asList(session1, session2, session3);

            WorkoutSessionDTO dto1 = new WorkoutSessionDTO(1L, LocalDate.now(), 60, null, null, null);
            WorkoutSessionDTO dto2 = new WorkoutSessionDTO(2L, LocalDate.now().minusDays(1), 45, null, null, null);
            WorkoutSessionDTO dto3 = new WorkoutSessionDTO(3L, LocalDate.now().minusDays(2), 30, null, null, null);

            when(userRepository.findByUsername(TEST_USERNAME)).thenReturn(Optional.of(testUser));
            when(sessionRepository.sumTotalVolumeByUserId(testUser.getId())).thenReturn(0.0);
            when(sessionRepository.countByUserId(testUser.getId())).thenReturn(3L);
            when(sessionRepository.countByUserIdAndDateAfter(eq(testUser.getId()), any())).thenReturn(3L);
            when(sessionRepository.findRecentByUserId(eq(testUser.getId()), any(PageRequest.class)))
                .thenReturn(sessions);
            when(sessionMapper.toDTO(session1)).thenReturn(dto1);
            when(sessionMapper.toDTO(session2)).thenReturn(dto2);
            when(sessionMapper.toDTO(session3)).thenReturn(dto3);
            when(sessionRepository.findRecentSessionVolumes(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());
            when(sessionRepository.countSessionsByDate(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());

            WorkoutDashboardDTO result = workoutSessionService.getWorkoutDashboard(TEST_USERNAME, TEST_TIMEZONE);

            assertThat(result.getRecentSessions()).hasSize(3);
            verify(sessionRepository).findRecentByUserId(eq(testUser.getId()), eq(PageRequest.of(0, 3)));
        }
    }

    @Nested
    @DisplayName("타임존 처리")
    class TimezoneHandling {

        @Test
        @DisplayName("유효한 타임존 처리")
        void shouldHandleValidTimezone() {
            when(userRepository.findByUsername(TEST_USERNAME)).thenReturn(Optional.of(testUser));
            when(sessionRepository.sumTotalVolumeByUserId(testUser.getId())).thenReturn(0.0);
            when(sessionRepository.countByUserId(testUser.getId())).thenReturn(0L);
            when(sessionRepository.countByUserIdAndDateAfter(eq(testUser.getId()), any())).thenReturn(0L);
            when(sessionRepository.findRecentByUserId(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());
            when(sessionRepository.findRecentSessionVolumes(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());
            when(sessionRepository.countSessionsByDate(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());

            assertThatCode(() -> workoutSessionService.getWorkoutDashboard(TEST_USERNAME, "America/New_York"))
                .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("UTC 타임존 처리")
        void shouldHandleUTCTimezone() {
            when(userRepository.findByUsername(TEST_USERNAME)).thenReturn(Optional.of(testUser));
            when(sessionRepository.sumTotalVolumeByUserId(testUser.getId())).thenReturn(0.0);
            when(sessionRepository.countByUserId(testUser.getId())).thenReturn(0L);
            when(sessionRepository.countByUserIdAndDateAfter(eq(testUser.getId()), any())).thenReturn(0L);
            when(sessionRepository.findRecentByUserId(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());
            when(sessionRepository.findRecentSessionVolumes(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());
            when(sessionRepository.countSessionsByDate(eq(testUser.getId()), any())).thenReturn(Collections.emptyList());

            WorkoutDashboardDTO result = workoutSessionService.getWorkoutDashboard(TEST_USERNAME, "UTC");

            assertThat(result.getHeatmapStartDate()).isEqualTo(LocalDate.now(ZoneId.of("UTC")).minusDays(364));
        }
    }

    private WorkoutSession createTestSession(Long id, LocalDateTime date) {
        WorkoutSession session = new WorkoutSession();
        session.setId(id);
        session.setUser(testUser);
        session.setDate(date);
        session.setDuration(60);
        return session;
    }
}
