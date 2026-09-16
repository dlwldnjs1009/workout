package com.example.workout.service;

import com.example.workout.entity.DietSession;
import com.example.workout.entity.User;
import com.example.workout.repository.DietSessionRepository;
import com.example.workout.repository.UserProfileRepository;
import com.example.workout.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 만료된 게스트 계정과 그 데이터를 지운다.
 * User는 루틴·세션만 cascade하므로 프로필·식단은 외래 키 위반을 피하려고 먼저 지운다.
 */
@Service
@RequiredArgsConstructor
public class GuestCleanupService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final DietSessionRepository dietSessionRepository;

    /**
     * @return 이번 실행에서 삭제한 게스트 계정 수. 한 번에 지우는 양은 쿼리에서 제한된다.
     */
    @Transactional
    public int purgeExpiredGuests() {
        List<User> expired = userRepository.findTop200ByGuestTrueAndExpiresAtBefore(LocalDateTime.now());
        if (expired.isEmpty()) {
            return 0;
        }

        for (User guest : expired) {
            List<DietSession> dietSessions = dietSessionRepository.findAllByUserIdOrderByDateDesc(guest.getId());
            dietSessionRepository.deleteAll(dietSessions);
            userProfileRepository.findByUser(guest).ifPresent(userProfileRepository::delete);
        }
        userRepository.deleteAll(expired);

        return expired.size();
    }
}
