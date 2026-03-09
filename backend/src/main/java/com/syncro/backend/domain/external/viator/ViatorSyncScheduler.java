package com.syncro.backend.domain.external.viator;

import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class ViatorSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(ViatorSyncScheduler.class);

    private final ViatorConfig viatorConfig;
    private final ViatorSyncService viatorSyncService;
    private final AtomicBoolean running = new AtomicBoolean(false);

    public ViatorSyncScheduler(
        ViatorConfig viatorConfig,
        ViatorSyncService viatorSyncService
    ) {
        this.viatorConfig = viatorConfig;
        this.viatorSyncService = viatorSyncService;
    }

    @Scheduled(
        cron = "${app.viator.sync.cron:0 */30 * * * *}",
        zone = "${app.viator.sync.zone:UTC}"
    )
    public void syncIncrementalProducts() {
        if (!viatorConfig.getSync().isEnabled()) {
            return;
        }
        if (!viatorConfig.isConfigured()) {
            log.warn("Scheduled Viator sync skipped: API key is not configured");
            return;
        }
        if (!running.compareAndSet(false, true)) {
            log.warn("Viator sync is already running, skipping this trigger");
            return;
        }

        try {
            ViatorSyncService.SyncCommand command = new ViatorSyncService.SyncCommand(
                viatorConfig.getSync().getDefaultCount(),
                viatorConfig.getSync().getDefaultMaxPages(),
                null,
                false,
                viatorConfig.getDefaultLanguage()
            );
            viatorSyncService.syncProducts(command);
        } catch (RuntimeException ex) {
            log.error("Viator sync scheduler error: {}", ex.getMessage(), ex);
        } finally {
            running.set(false);
        }
    }
}
