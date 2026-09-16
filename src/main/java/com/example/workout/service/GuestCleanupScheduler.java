package com.example.workout.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GuestCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(GuestCleanupScheduler.class);

    private final GuestCleanupService guestCleanupService;

    /** 매시 10분에 만료된 게스트 계정을 정리한다. */
    @Scheduled(cron = "0 10 * * * *")
    public void purgeExpiredGuests() {
        int deleted = guestCleanupService.purgeExpiredGuests();
        if (deleted > 0) {
            log.info("Purged {} expired guest account(s)", deleted);
        }
    }
}
