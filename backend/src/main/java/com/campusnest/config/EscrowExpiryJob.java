package com.campusnest.config;

import com.campusnest.service.EscrowService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Every 10 minutes, returns beds from reservations older than 48 hours. */
@Component
public class EscrowExpiryJob {

    private static final Logger log = LoggerFactory.getLogger(EscrowExpiryJob.class);

    private final EscrowService escrow;

    public EscrowExpiryJob(EscrowService escrow) {
        this.escrow = escrow;
    }

    @Scheduled(fixedDelayString = "PT10M", initialDelayString = "PT1M")
    public void releaseExpired() {
        int released = escrow.releaseExpired();
        if (released > 0) {
            log.info("Released {} expired reservation(s)", released);
        }
    }
}
