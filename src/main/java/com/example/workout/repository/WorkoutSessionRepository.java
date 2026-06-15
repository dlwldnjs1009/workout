package com.example.workout.repository;

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

    // 페이지네이션 적용된 세션 조회 (컬렉션 fetch join 없이 ID만 페이징)
    // Note: @EntityGraph + Pageable은 Hibernate 6에서 에러 발생 (in-memory pagination 금지)
    //       -> ID 페이징 후 findByIdIn으로 fetch (식단 조회와 동일 패턴)
    @Query("SELECT s.id FROM WorkoutSession s WHERE s.user.id = :userId ORDER BY s.date DESC")
    Page<Long> findIdsByUserIdOrderByDateDesc(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT DISTINCT s FROM WorkoutSession s " +
           "LEFT JOIN FETCH s.exercisesPerformed r " +
           "LEFT JOIN FETCH r.exerciseType " +
           "WHERE s.id IN :ids")
    List<WorkoutSession> findByIdIn(@Param("ids") List<Long> ids);

    // 최근 N개 세션 조회 (대시보드용)
    // Note: @EntityGraph + Pageable 조합 불가, 별도 fetch 필요 시 서비스에서 처리
    @Query("SELECT s FROM WorkoutSession s " +
           "WHERE s.user.id = :userId " +
           "ORDER BY s.date DESC")
    List<WorkoutSession> findRecentByUserId(@Param("userId") Long userId, Pageable pageable);

    // 볼륨 집계
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

    // 볼륨 차트용 최근 세션 데이터 (Native Query로 LIMIT 직접 적용)
    // Note: JPQL + collection JOIN + Pageable은 Hibernate 6에서 에러 발생
    @Query(value = "SELECT s.date, COALESCE(SUM(r.weight * r.reps), 0) " +
           "FROM workout_sessions s LEFT JOIN exercise_records r ON s.id = r.session_id " +
           "WHERE s.user_id = :userId " +
           "GROUP BY s.id, s.date " +
           "ORDER BY s.date DESC " +
           "LIMIT 10", nativeQuery = true)
    List<Object[]> findRecentSessionVolumes(@Param("userId") Long userId);

    @EntityGraph(attributePaths = {"exercisesPerformed", "exercisesPerformed.exerciseType"})
    java.util.Optional<WorkoutSession> findByIdAndUser_Username(Long id, String username);

    // 기간 조회 + 레코드/운동종목까지 한 번에 fetch (N+1 방지)
    // Pageable 없음 -> Hibernate 6 in-memory pagination 제약에 해당하지 않음
    // 컬렉션 fetch로 인한 root 중복은 DISTINCT로 제거
    @Query("SELECT DISTINCT s FROM WorkoutSession s " +
           "LEFT JOIN FETCH s.exercisesPerformed r " +
           "LEFT JOIN FETCH r.exerciseType " +
           "WHERE s.user.id = :userId AND s.date BETWEEN :startDate AND :endDate " +
           "ORDER BY s.date DESC")
    List<WorkoutSession> findByUserIdAndDateBetweenOrderByDateDesc(
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
}
