package com.example.workout.repository;

import com.example.workout.dto.DashboardStatsDTO;
import com.example.workout.entity.WorkoutSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, Long> {

    // 페이지네이션 적용된 세션 조회
    // Note: @EntityGraph + Pageable은 Hibernate 6에서 에러 발생 (in-memory pagination 금지)
    Page<WorkoutSession> findByUserIdOrderByDateDesc(Long userId, Pageable pageable);

    // 최근 N개 세션 조회 (대시보드용)
    // Note: @EntityGraph + Pageable 조합 불가, 별도 fetch 필요 시 서비스에서 처리
    @Query("SELECT s FROM WorkoutSession s " +
           "WHERE s.user.id = :userId " +
           "ORDER BY s.date DESC")
    List<WorkoutSession> findRecentByUserId(@Param("userId") Long userId, Pageable pageable);

    // 대시보드 통계 집계 (복잡한 JPQL 대신 개별 쿼리 조합)
    default DashboardStatsDTO getDashboardStats(Long userId, LocalDateTime monthStart) {
        Double totalVolume = sumTotalVolumeByUserId(userId);
        if (totalVolume == null) {
            totalVolume = 0.0;
        }
        long totalWorkouts = countByUserId(userId);
        long monthlyWorkouts = countByUserIdAndDateAfter(userId, monthStart);

        return new DashboardStatsDTO(totalWorkouts, totalVolume, monthlyWorkouts);
    }

    // 볼륨 집계 (기존 유지, 대시보드 통계 쿼리 fallback용)
    @Query("SELECT COALESCE(SUM(r.weight * r.reps), 0) FROM WorkoutSession s JOIN s.exercisesPerformed r WHERE s.user.id = :userId")
    Double sumTotalVolumeByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(s) FROM WorkoutSession s WHERE s.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(s) FROM WorkoutSession s WHERE s.user.id = :userId AND s.date >= :startDate")
    long countByUserIdAndDateAfter(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate);

    // Heatmap용 날짜별 집계 쿼리 (메모리 처리 → DB 처리)
    @Query("SELECT CAST(s.date AS LocalDate) as workoutDate, COUNT(s) as cnt " +
           "FROM WorkoutSession s " +
           "WHERE s.user.id = :userId AND s.date >= :startDate " +
           "GROUP BY CAST(s.date AS LocalDate)")
    List<Object[]> countSessionsByDate(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate);

    // 볼륨 차트용 최근 세션 데이터 (스트림 처리 → DB 처리)
    @Query("SELECT s.date, COALESCE(SUM(r.weight * r.reps), 0) " +
           "FROM WorkoutSession s LEFT JOIN s.exercisesPerformed r " +
           "WHERE s.user.id = :userId " +
           "GROUP BY s.id, s.date " +
           "ORDER BY s.date DESC")
    List<Object[]> findRecentSessionVolumes(@Param("userId") Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"exercisesPerformed", "exercisesPerformed.exerciseType"})
    java.util.Optional<WorkoutSession> findByIdAndUser_Username(Long id, String username);

    List<WorkoutSession> findByUserIdAndDateBetweenOrderByDateDesc(Long userId, LocalDateTime startDate, LocalDateTime endDate);
}
