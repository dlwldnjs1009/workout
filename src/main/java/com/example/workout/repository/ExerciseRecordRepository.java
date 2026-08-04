package com.example.workout.repository;

import com.example.workout.entity.ExerciseRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExerciseRecordRepository extends JpaRepository<ExerciseRecord, Long> {

    @Query("SELECT r FROM ExerciseRecord r JOIN FETCH r.exerciseType " +
           "WHERE r.session.id = :sessionId AND r.exerciseType.id = :exerciseId " +
           "ORDER BY r.setNumber ASC")
    List<ExerciseRecord> findBySessionIdAndExerciseTypeIdOrderBySetNumber(
            @Param("sessionId") Long sessionId,
            @Param("exerciseId") Long exerciseId);

    @Query("SELECT r FROM ExerciseRecord r " +
           "JOIN FETCH r.session s " +
           "JOIN FETCH r.exerciseType " +
           "WHERE s.user.id = :userId AND r.exerciseType.id = :exerciseId " +
           "ORDER BY s.date ASC, s.id ASC, r.setNumber ASC")
    List<ExerciseRecord> findProgressRecordsByUserIdAndExerciseId(
            @Param("userId") Long userId,
            @Param("exerciseId") Long exerciseId);
}
