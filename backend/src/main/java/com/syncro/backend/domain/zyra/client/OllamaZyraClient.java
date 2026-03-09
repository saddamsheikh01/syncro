package com.syncro.backend.domain.zyra.client;

import com.syncro.backend.common.exception.ExternalServiceException;
import com.syncro.backend.config.ZyraProperties;
import java.util.List;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

public class OllamaZyraClient implements ZyraClient {

    private final RestClient restClient;
    private final String model;

    public OllamaZyraClient(ZyraProperties properties) {
        this.model = properties.model();
        int timeoutMs = Math.max(properties.timeoutSeconds(), 1) * 1000;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(timeoutMs);
        requestFactory.setReadTimeout(timeoutMs);
        this.restClient = RestClient.builder()
            .baseUrl(properties.baseUrl())
            .requestFactory(requestFactory)
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
                throw new ExternalServiceException("Invalid Ollama response");
            }
            String content = response.message.content();
            if (content == null || content.isBlank()) {
                throw new ExternalServiceException("Invalid Ollama response");
            }
            return content.trim();
        } catch (RestClientResponseException ex) {
            throw new ExternalServiceException("Ollama error: " + ex.getStatusCode(), ex);
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
