package com.example.workout.service;

import com.example.workout.entity.ExerciseType;
import com.example.workout.repository.ExerciseTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExerciseTypeService {
    private final ExerciseTypeRepository exerciseRepository;

    /**
     * 모든 운동 목록 조회 (24시간 캐싱)
     * - 거의 변경되지 않는 정적 데이터
     * - 모든 페이지에서 사용되므로 캐싱으로 성능 대폭 향상
     */
    @Cacheable(value = "exercises", unless = "#result == null || #result.isEmpty()")
    public List<ExerciseType> getAllExercises() {
        return exerciseRepository.findAll();
    }

    /**
     * 카테고리별 운동 조회 (24시간 캐싱)
     */
    @Cacheable(value = "exercises", key = "#category.name()", unless = "#result == null || #result.isEmpty()")
    public List<ExerciseType> getExercisesByCategory(ExerciseType.ExerciseCategory category) {
        return exerciseRepository.findByCategory(category);
    }
}
