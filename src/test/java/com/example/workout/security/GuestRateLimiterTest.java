package com.example.workout.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("GuestRateLimiter 테스트")
class GuestRateLimiterTest {

    private final MutableClock clock = new MutableClock(Instant.parse("2026-09-16T00:00:00Z"));
    private final GuestRateLimiter limiter = new GuestRateLimiter(clock);

    @Test
    @DisplayName("같은 클라이언트는 창(window) 안에서 제한 횟수까지만 허용한다")
    void shouldAllowUpToLimitWithinWindow() {
        for (int i = 0; i < GuestRateLimiter.MAX_PER_WINDOW; i++) {
            assertThat(limiter.tryAcquire("1.1.1.1")).isTrue();
        }

        assertThat(limiter.tryAcquire("1.1.1.1")).isFalse();
    }

    @Test
    @DisplayName("다른 클라이언트의 한도는 서로 영향을 주지 않는다")
    void shouldTrackClientsIndependently() {
        for (int i = 0; i < GuestRateLimiter.MAX_PER_WINDOW; i++) {
            limiter.tryAcquire("1.1.1.1");
        }

        assertThat(limiter.tryAcquire("1.1.1.1")).isFalse();
        assertThat(limiter.tryAcquire("2.2.2.2")).isTrue();
    }

    @Test
    @DisplayName("창이 지나면 한도가 초기화된다")
    void shouldResetAfterWindow() {
        for (int i = 0; i < GuestRateLimiter.MAX_PER_WINDOW; i++) {
            limiter.tryAcquire("1.1.1.1");
        }
        assertThat(limiter.tryAcquire("1.1.1.1")).isFalse();

        clock.advance(GuestRateLimiter.WINDOW.plusSeconds(1));

        assertThat(limiter.tryAcquire("1.1.1.1")).isTrue();
    }

    @Test
    @DisplayName("추적 대상이 상한을 넘으면 비워서 메모리가 무한히 늘지 않는다")
    void shouldEvictWhenTrackedClientsExceedCap() {
        for (int i = 0; i <= GuestRateLimiter.MAX_TRACKED_CLIENTS; i++) {
            limiter.tryAcquire("client-" + i);
        }

        assertThat(limiter.trackedClients()).isLessThanOrEqualTo(GuestRateLimiter.MAX_TRACKED_CLIENTS);
    }

    private static class MutableClock extends Clock {
        private Instant instant;

        MutableClock(Instant instant) {
            this.instant = instant;
        }

        void advance(Duration duration) {
            instant = instant.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
