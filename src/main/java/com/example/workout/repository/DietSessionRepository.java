package com.example.workout.repository;

import com.example.workout.entity.DietSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DietSessionRepository extends JpaRepository<DietSession, Long> {

    @EntityGraph(attributePaths = {"foodEntries"})
    List<DietSession> findAllByUserIdOrderByDateDesc(Long userId);

    // 페이지네이션 지원 (컬렉션 fetch join 없이 ID 페이징)
    @Query("SELECT s.id FROM DietSession s WHERE s.user.id = :userId ORDER BY s.date DESC")
    Page<Long> findIdsByUserIdOrderByDateDesc(@Param("userId") Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"foodEntries"})
    Optional<DietSession> findByIdAndUserId(Long id, Long userId);

    @EntityGraph(attributePaths = {"foodEntries"})
    Optional<DietSession> findByUserIdAndDate(Long userId, LocalDate date);

    @EntityGraph(attributePaths = {"foodEntries"})
    List<DietSession> findByIdIn(List<Long> ids);
}
