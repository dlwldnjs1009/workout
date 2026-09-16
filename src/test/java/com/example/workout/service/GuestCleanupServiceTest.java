package com.example.workout.service;

import com.example.workout.entity.DietSession;
import com.example.workout.entity.User;
import com.example.workout.entity.UserProfile;
import com.example.workout.repository.DietSessionRepository;
import com.example.workout.repository.UserProfileRepository;
import com.example.workout.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("GuestCleanupService 테스트")
class GuestCleanupServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserProfileRepository userProfileRepository;
    @Mock
    private DietSessionRepository dietSessionRepository;
    @InjectMocks
    private GuestCleanupService guestCleanupService;

    @Test
    @DisplayName("만료된 게스트가 없으면 아무것도 지우지 않는다")
    void shouldDoNothingWhenNoExpiredGuests() {
        when(userRepository.findTop200ByGuestTrueAndExpiresAtBefore(any(LocalDateTime.class))).thenReturn(List.of());

        assertThat(guestCleanupService.purgeExpiredGuests()).isZero();

        verify(userRepository, never()).deleteAll(any());
        verifyNoInteractions(userProfileRepository, dietSessionRepository);
    }

    @Test
    @DisplayName("만료된 게스트의 프로필·식단을 먼저 지우고 계정을 지운다")
    void shouldDeleteDependentsBeforeUsers() {
        User expired = guest(1L);
        UserProfile profile = new UserProfile();
        DietSession dietSession = new DietSession();

        when(userRepository.findTop200ByGuestTrueAndExpiresAtBefore(any(LocalDateTime.class))).thenReturn(List.of(expired));
        when(userProfileRepository.findByUser(expired)).thenReturn(Optional.of(profile));
        when(dietSessionRepository.findAllByUserIdOrderByDateDesc(1L)).thenReturn(List.of(dietSession));

        assertThat(guestCleanupService.purgeExpiredGuests()).isEqualTo(1);

        InOrder order = inOrder(dietSessionRepository, userProfileRepository, userRepository);
        order.verify(dietSessionRepository).deleteAll(List.of(dietSession));
        order.verify(userProfileRepository).delete(profile);
        order.verify(userRepository).deleteAll(List.of(expired));
    }

    @Test
    @DisplayName("프로필이 없는 게스트도 정상적으로 지운다")
    void shouldDeleteGuestWithoutProfile() {
        User expired = guest(2L);

        when(userRepository.findTop200ByGuestTrueAndExpiresAtBefore(any(LocalDateTime.class))).thenReturn(List.of(expired));
        when(userProfileRepository.findByUser(expired)).thenReturn(Optional.empty());
        when(dietSessionRepository.findAllByUserIdOrderByDateDesc(anyLong())).thenReturn(List.of());

        assertThat(guestCleanupService.purgeExpiredGuests()).isEqualTo(1);

        verify(userProfileRepository, never()).delete(any(UserProfile.class));
        verify(userRepository).deleteAll(List.of(expired));
    }

    private User guest(Long id) {
        User user = new User();
        user.setId(id);
        user.setUsername("guest_" + id);
        user.setGuest(true);
        user.setExpiresAt(LocalDateTime.now().minusHours(1));
        return user;
    }
}
