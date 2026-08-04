package com.example.workout.repository;

import com.example.workout.entity.WorkoutRoutine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkoutRoutineRepository extends JpaRepository<WorkoutRoutine, Long> {

    @EntityGraph(attributePaths = {"routineExercises", "routineExercises.exerciseType"})
    @Query("SELECT r FROM WorkoutRoutine r WHERE r.user.id = :userId ORDER BY r.createdAt DESC")
    List<WorkoutRoutine> findByUserIdWithExercises(@Param("userId") Long userId);

    // 페이지네이션 지원
    @EntityGraph(attributePaths = {"routineExercises", "routineExercises.exerciseType"})
    Page<WorkoutRoutine> findByUserId(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"routineExercises", "routineExercises.exerciseType"})
    Optional<WorkoutRoutine> findByIdAndUser_Username(Long id, String username);
}
