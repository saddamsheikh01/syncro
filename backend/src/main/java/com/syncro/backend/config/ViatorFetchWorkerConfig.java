package com.syncro.backend.config;

import java.util.concurrent.Executor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
public class ViatorFetchWorkerConfig {

    @Bean(name = "viatorFetchWorkerExecutor")
    public Executor viatorFetchWorkerExecutor(
        @Value("${app.viator-fetch-worker.concurrency:6}") int concurrency
    ) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(Math.max(1, concurrency));
        executor.setMaxPoolSize(Math.max(1, concurrency));
        executor.setQueueCapacity(0);
        executor.setThreadNamePrefix("viator-fetch-");
        executor.initialize();
        return executor;
    }
}
