package com.syncro.backend.domain.zyra.client;

import com.syncro.backend.config.ZyraProperties;
import java.util.List;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

public class OllamaZyraClient implements ZyraClient {

    private final RestClient restClient;
    private final String model;

    public OllamaZyraClient(ZyraProperties properties) {
        this.model = properties.model();
        this.restClient = RestClient.builder()
            .baseUrl(properties.baseUrl())
            .build();
    }

    @Override
    public String chat(List<ZyraChatMessage> messages) {
        OllamaChatRequest request = new OllamaChatRequest(model, messages, false);
        try {
            OllamaChatResponse response = restClient.post()
                .uri("/api/chat")
                .body(request)
                .retrieve()
                .body(OllamaChatResponse.class);
            if (response == null || response.message == null) {
                throw new IllegalStateException("Risposta Ollama non valida");
            }
            String content = response.message.content();
            if (content == null || content.isBlank()) {
                throw new IllegalStateException("Risposta Ollama non valida");
            }
            return content.trim();
        } catch (RestClientResponseException ex) {
            throw new IllegalStateException("Errore Ollama: " + ex.getStatusCode(), ex);
        }
    }

    private record OllamaChatRequest(
        String model,
        List<ZyraChatMessage> messages,
        boolean stream
    ) {
    }

    private static class OllamaChatResponse {
        private ZyraChatMessage message;

        public ZyraChatMessage getMessage() {
            return message;
        }

        public void setMessage(ZyraChatMessage message) {
            this.message = message;
        }
    }
}
