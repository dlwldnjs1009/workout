package com.example.workout.service;

import com.example.workout.dto.ExerciseRecordDTO;
import com.example.workout.dto.VolumeDataPointDTO;
import com.example.workout.dto.WorkoutDashboardDTO;
import com.example.workout.dto.WorkoutSessionDTO;
import com.example.workout.entity.*;
import com.example.workout.exception.ResourceNotFoundException;
import com.example.workout.exception.UserNotFoundException;
import com.example.workout.mapper.WorkoutSessionMapper;
import com.example.workout.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkoutSessionService {
	private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Seoul");

    private final WorkoutSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final ExerciseTypeRepository exerciseTypeRepository;
    private final ExerciseRecordRepository exerciseRecordRepository;
    private final WorkoutSessionMapper sessionMapper;

	private User getUser(String username) {
		return userRepository.findByUsername(username)
			.orElseThrow(() -> new UserNotFoundException("사용자를 찾을 수 없습니다: " + username));
	}

    @Transactional
    public WorkoutSessionDTO createSession(String username, WorkoutSessionDTO dto) {
        User user = getUser(username);

        WorkoutSession session = new WorkoutSession();
        session.setUser(user);

        LocalDate inputDate = dto.getDate();
        LocalDate today = LocalDate.now(DEFAULT_ZONE);
        
        if (inputDate != null) {
            if (inputDate.isEqual(today)) {
                session.setDate(LocalDateTime.now(DEFAULT_ZONE));
            } else {
                session.setDate(inputDate.atStartOfDay());
            }
        } else {
            session.setDate(LocalDateTime.now(DEFAULT_ZONE));
        }

        session.setDuration(dto.getDuration());
        session.setNotes(dto.getNotes());

        session = sessionRepository.save(session);

        if (dto.getExercisesPerformed() != null && !dto.getExercisesPerformed().isEmpty()) {
            for (ExerciseRecordDTO recordDTO : dto.getExercisesPerformed()) {
                ExerciseRecord record = new ExerciseRecord();
                record.setSession(session);

                ExerciseType exerciseType = exerciseTypeRepository.findById(recordDTO.getExerciseId())
                    .orElseThrow(() -> new ResourceNotFoundException("운동 종목을 찾을 수 없습니다."));
                record.setExerciseType(exerciseType);

                record.setSetNumber(recordDTO.getSetNumber());
                record.setReps(recordDTO.getReps());
                record.setWeight(recordDTO.getWeight());
                record.setDuration(recordDTO.getDuration());
                record.setRpe(recordDTO.getRpe());

                exerciseRecordRepository.save(record);
            }
        }

        return sessionMapper.toDTO(session);
    }

    /**
     * 페이지네이션이 적용된 세션 조회 (성능 최적화)
     */
    @Transactional(readOnly = true)
    public Page<WorkoutSessionDTO> getUserSessions(String username, Pageable pageable) {
        User user = getUser(username);

        return sessionRepository.findByUserIdOrderByDateDesc(user.getId(), pageable)
            .map(sessionMapper::toDTO);
    }

    /**
     * 기존 호환성 유지용 - 전체 조회 (deprecated, 페이지네이션 버전 사용 권장)
     */
    @Transactional(readOnly = true)
    public List<WorkoutSessionDTO> getUserSessions(String username) {
        return getUserSessions(username, PageRequest.of(0, 100)).getContent();
    }

    @Transactional(readOnly = true)
    public List<WorkoutSessionDTO> getUserSessionsByDateRange(String username, String startDateStr, String endDateStr) {
        User user = getUser(username);
        LocalDateTime start = LocalDate.parse(startDateStr).atStartOfDay();
        LocalDateTime end = LocalDate.parse(endDateStr).atTime(23, 59, 59);

        return sessionRepository.findByUserIdAndDateBetweenOrderByDateDesc(user.getId(), start, end)
                .stream()
                .map(sessionMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * 대시보드 조회 - 최적화된 버전
     * - 4개 쿼리 → 3개 쿼리로 통합 (통계 + 최근세션 + heatmap)
     * - 메모리 스트림 처리 → DB 집계 쿼리
     */
    @Transactional(readOnly = true)
    public WorkoutDashboardDTO getWorkoutDashboard(String username, String tz) {
        User user = getUser(username);

        ZoneId zoneId = ZoneId.of(tz);
        LocalDateTime startOfMonth = LocalDateTime.now(zoneId)
            .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);

        // 통계 쿼리 (개별 쿼리 사용 - 복잡한 집계 쿼리보다 안정적)
        // 같은 클래스 내 호출은 @Cacheable 프록시를 우회하므로 직접 호출
        Double totalVolume = sessionRepository.sumTotalVolumeByUserId(user.getId());
        if (totalVolume == null) totalVolume = 0.0;
        long totalWorkouts = sessionRepository.countByUserId(user.getId());
        long monthlyWorkouts = sessionRepository.countByUserIdAndDateAfter(user.getId(), startOfMonth);

        // 최근 3개 세션
        List<WorkoutSession> recentSessions = sessionRepository
            .findRecentByUserId(user.getId(), PageRequest.of(0, 3));
        List<WorkoutSessionDTO> recentSessionDTOs = recentSessions.stream()
            .map(sessionMapper::toDTO)
            .collect(Collectors.toList());

        // 볼륨 차트 데이터 (DB에서 집계, Native Query로 LIMIT 10 적용)
        List<Object[]> volumeData = sessionRepository
            .findRecentSessionVolumes(user.getId());
        List<VolumeDataPointDTO> volumeChartData = new ArrayList<>();
        for (Object[] row : volumeData) {
            // Native Query는 java.sql.Timestamp 반환
            LocalDateTime date;
            if (row[0] instanceof LocalDateTime) {
                date = (LocalDateTime) row[0];
            } else if (row[0] instanceof java.sql.Timestamp) {
                date = ((java.sql.Timestamp) row[0]).toLocalDateTime();
            } else {
                continue;
            }
            Double volume = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
            volumeChartData.add(VolumeDataPointDTO.builder()
                .date(date.atZone(ZoneId.of("UTC")).withZoneSameInstant(zoneId)
                    .format(DateTimeFormatter.ofPattern("MM.dd")))
                .volume(volume)
                .build());
        }
        Collections.reverse(volumeChartData);

        // Heatmap 데이터 (DB에서 집계 - 메모리 처리 제거)
        LocalDate today = LocalDate.now(zoneId);
        LocalDate startDate = today.minusDays(364);
        LocalDateTime startDateTime = startDate.atStartOfDay();

        List<Object[]> dateCounts = sessionRepository.countSessionsByDate(user.getId(), startDateTime);
        Map<LocalDate, Long> countsByDate = new HashMap<>();
        for (Object[] row : dateCounts) {
            LocalDate date = row[0] instanceof LocalDate ? (LocalDate) row[0]
                : ((java.sql.Date) row[0]).toLocalDate();
            Long count = ((Number) row[1]).longValue();
            countsByDate.put(date, count);
        }

        int[] levels = new int[365];
        for (int i = 0; i < 365; i++) {
            LocalDate date = startDate.plusDays(i);
            long count = countsByDate.getOrDefault(date, 0L);
            levels[i] = count > 0 ? 3 : 0;
        }
        List<Integer> heatmapLevels = Arrays.stream(levels).boxed().collect(Collectors.toList());

        return WorkoutDashboardDTO.builder()
            .totalVolume(totalVolume)
            .totalWorkouts(totalWorkouts)
            .monthlyWorkouts(monthlyWorkouts)
            .recentSessions(recentSessionDTOs)
            .volumeChartData(volumeChartData)
            .heatmapStartDate(startDate)
            .heatmapLevels(heatmapLevels)
            .build();
    }

    @Transactional(readOnly = true)
    public WorkoutSessionDTO getSessionById(Long sessionId, String username) {
        WorkoutSession session = sessionRepository.findByIdAndUser_Username(sessionId, username)
            .orElseThrow(() -> new ResourceNotFoundException("운동 세션을 찾을 수 없거나 접근 권한이 없습니다."));
        return sessionMapper.toDTO(session);
    }

    @Transactional
    public void deleteSession(Long id, String username) {
        WorkoutSession session = sessionRepository.findByIdAndUser_Username(id, username)
            .orElseThrow(() -> new ResourceNotFoundException("운동 세션을 찾을 수 없거나 접근 권한이 없습니다."));
        sessionRepository.delete(session);
    }

}
