package com.example.workout.service;

import com.example.workout.dto.DietDashboardDTO;
import com.example.workout.dto.DietSessionDTO;
import com.example.workout.dto.FoodEntryDTO;
import com.example.workout.entity.DietSession;
import com.example.workout.entity.FoodEntry;
import com.example.workout.entity.User;
import com.example.workout.mapper.DietSessionMapper;
import com.example.workout.repository.DietSessionRepository;
import com.example.workout.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DietSessionService {

    private final DietSessionRepository dietSessionRepository;
    private final UserRepository userRepository;
    private final DietSessionMapper dietSessionMapper;

    /**
     * 페이지네이션 적용된 식단 조회 (성능 최적화)
     */
    public Page<DietSessionDTO> getAllDietSessions(String username, Pageable pageable) {
        User user = getUser(username);
        Page<Long> idPage = dietSessionRepository.findIdsByUserIdOrderByDateDesc(user.getId(), pageable);
        if (idPage.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, idPage.getTotalElements());
        }

        List<DietSession> sessions = dietSessionRepository.findByIdIn(idPage.getContent());
        Map<Long, DietSession> sessionsById = sessions.stream()
            .collect(Collectors.toMap(DietSession::getId, Function.identity()));

        List<DietSessionDTO> content = idPage.getContent().stream()
            .map(sessionsById::get)
            .filter(Objects::nonNull)
            .map(dietSessionMapper::toDTO)
            .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, idPage.getTotalElements());
    }

    /**
     * 기존 호환성 유지용 (deprecated)
     */
    public List<DietSessionDTO> getAllDietSessions(String username) {
        return getAllDietSessions(username, PageRequest.of(0, 100)).getContent();
    }

    @Transactional(readOnly = true)
    public DietDashboardDTO getTodayDietSummary(String username, String tz) {
        User user = getUser(username);
        java.time.ZoneId zoneId = java.time.ZoneId.of(tz);
        java.time.LocalDate today = java.time.LocalDate.now(zoneId);
        return dietSessionRepository.findByUserIdAndDate(user.getId(), today)
                .map(session -> {
                    int calories = 0, protein = 0, carbs = 0, fat = 0;
                    for (FoodEntry entry : session.getFoodEntries()) {
                        calories += entry.getCalories();
                        protein += entry.getProtein() != null ? entry.getProtein() : 0;
                        carbs += entry.getCarbs() != null ? entry.getCarbs() : 0;
                        fat += entry.getFat() != null ? entry.getFat() : 0;
                    }
                    return DietDashboardDTO.builder()
                            .calories(calories)
                            .protein(protein)
                            .carbs(carbs)
                            .fat(fat)
                            .hasData(true)
                            .build();
                })
                .orElse(DietDashboardDTO.builder().hasData(false).build());
    }

    @Transactional(readOnly = true)
    public DietSessionDTO getDietSession(Long id, String username) {
        User user = getUser(username);
        DietSession dietSession = dietSessionRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Diet session not found"));
        return dietSessionMapper.toDTO(dietSession);
    }

    @Transactional
    public DietSessionDTO createDietSession(DietSessionDTO dto, String username) {
        User user = getUser(username);
        DietSession dietSession;
        if (dto.getId() != null) {
            dietSession = dietSessionRepository.findByIdAndUserId(dto.getId(), user.getId())
                    .orElseThrow(() -> new RuntimeException("Diet session not found"));
            dietSession.setNotes(dto.getNotes());
            dietSession.setDate(dto.getDate());
            dietSession.getFoodEntries().clear();
        } else {
            dietSession = dietSessionRepository.findByUserIdAndDate(user.getId(), dto.getDate())
                    .map(existing -> {
                        existing.setNotes(dto.getNotes());
                        existing.getFoodEntries().clear();
                        return existing;
                    })
                    .orElseGet(() -> DietSession.builder()
                            .user(user)
                            .date(dto.getDate())
                            .notes(dto.getNotes())
                            .build());
        }

        if (dto.getFoodEntries() != null) {
            for (FoodEntryDTO foodDto : dto.getFoodEntries()) {
                FoodEntry entry = FoodEntry.builder()
                        .mealType(foodDto.getMealType())
                        .foodName(foodDto.getFoodName())
                        .calories(foodDto.getCalories())
                        .protein(foodDto.getProtein())
                        .carbs(foodDto.getCarbs())
                        .fat(foodDto.getFat())
                        .build();
                dietSession.addFoodEntry(entry);
            }
        }

        DietSession savedSession = dietSessionRepository.save(dietSession);
        return dietSessionMapper.toDTO(savedSession);
    }

    @Transactional
    public void deleteDietSession(Long id, String username) {
        User user = getUser(username);
        DietSession dietSession = dietSessionRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Diet session not found"));
        dietSessionRepository.delete(dietSession);
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }
}
