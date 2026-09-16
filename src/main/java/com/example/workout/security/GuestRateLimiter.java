package com.example.workout.security;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 게스트 계정 발급용 고정 창(fixed window) 제한기.
 * 공개 엔드포인트가 계정 테이블을 무제한으로 채우는 것을 막는 용도라 단일 인스턴스 기준 인메모리로 충분하다.
 * 다중 인스턴스로 확장하면 Redis 기반으로 옮겨야 한다.
 */
@Component
public class GuestRateLimiter {

    static final int MAX_PER_WINDOW = 30;
    static final Duration WINDOW = Duration.ofHours(1);
    static final int MAX_TRACKED_CLIENTS = 10_000;

    private final Clock clock;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public GuestRateLimiter() {
        this(Clock.systemUTC());
    }

    GuestRateLimiter(Clock clock) {
        this.clock = clock;
    }

    public boolean tryAcquire(String clientKey) {
        Instant now = clock.instant();

        Window window = windows.compute(clientKey, (key, current) -> {
            if (current == null || current.isExpired(now)) {
                return new Window(now, 1);
            }
            return new Window(current.startedAt(), current.count() + 1);
        });
        evictIfOverCapacity(now);

        return window.count() <= MAX_PER_WINDOW;
    }

    int trackedClients() {
        return windows.size();
    }

    private void evictIfOverCapacity(Instant now) {
        if (windows.size() <= MAX_TRACKED_CLIENTS) {
            return;
        }
        windows.values().removeIf(window -> window.isExpired(now));
        if (windows.size() > MAX_TRACKED_CLIENTS) {
            // 만료 항목만으로 줄지 않으면 전체를 버린다. 한도가 느슨해질 뿐 메모리는 지킨다.
            windows.clear();
        }
    }

    private record Window(Instant startedAt, int count) {
        boolean isExpired(Instant now) {
            return !now.isBefore(startedAt.plus(WINDOW));
        }
    }
}
