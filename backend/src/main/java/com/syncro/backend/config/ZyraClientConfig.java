package com.syncro.backend.config;

import com.syncro.backend.domain.zyra.client.OllamaZyraClient;
import com.syncro.backend.domain.zyra.client.OpenAiZyraClient;
import com.syncro.backend.domain.zyra.client.ZyraClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ZyraClientConfig {

    @Bean
    public ZyraClient zyraClient(ZyraProperties properties) {
        return switch (properties.provider()) {
            case OPENAI -> new OpenAiZyraClient(properties);
            case OLLAMA -> new OllamaZyraClient(properties);
        };
    }
}
