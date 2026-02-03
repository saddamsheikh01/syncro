package com.syncro.backend.domain.zyra.config;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
public class PromptLoader {

    private final Map<PromptType, String> cache = new ConcurrentHashMap<>();

    @PostConstruct
    void preload() {
        for (PromptType type : PromptType.values()) {
            getPrompt(type);
        }
    }

    public String getPrompt(PromptType type) {
        if (type == null) {
            throw new IllegalArgumentException("Tipo prompt non valido");
        }
        return cache.computeIfAbsent(type, this::loadPrompt);
    }

    public String getPrompt(PromptType type, Map<String, String> variables) {
        String prompt = getPrompt(type);
        if (variables == null || variables.isEmpty()) {
            return prompt;
        }
        String resolved = prompt;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue() == null ? "" : entry.getValue();
            resolved = resolved.replace("{{" + key + "}}", value);
        }
        return resolved;
    }

    private String loadPrompt(PromptType type) {
        ClassPathResource resource = new ClassPathResource(type.getPath());
        if (!resource.exists()) {
            throw new IllegalStateException("Prompt non trovato: " + type.getPath());
        }
        try (InputStream input = resource.getInputStream()) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8).trim();
        } catch (IOException ex) {
            throw new IllegalStateException("Errore lettura prompt: " + type.getPath(), ex);
        }
    }
}
