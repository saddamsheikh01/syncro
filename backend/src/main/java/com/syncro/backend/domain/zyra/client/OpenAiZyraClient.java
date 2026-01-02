package com.syncro.backend.domain.zyra.client;

import com.syncro.backend.common.exception.ExternalServiceException;
import com.syncro.backend.config.ZyraProperties;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

public class OpenAiZyraClient implements ZyraClient {

    private static final double DEFAULT_TEMPERATURE = 0.3;

    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    public OpenAiZyraClient(ZyraProperties properties) {
        this.apiKey = properties.apiKey();
        this.model = properties.model();
        this.restClient = RestClient.builder()
            .baseUrl(properties.baseUrl())
            .build();
    }

    @Override
    public String chat(List<ZyraChatMessage> messages) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ExternalServiceException("OPENAI_API_KEY mancante");
        }
        OpenAiChatRequest request = new OpenAiChatRequest(model, messages, DEFAULT_TEMPERATURE);
        try {
            OpenAiChatResponse response = restClient.post()
                .uri("/chat/completions")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .body(request)
                .retrieve()
                .body(OpenAiChatResponse.class);
            if (response == null || response.choices == null || response.choices.isEmpty()) {
                throw new ExternalServiceException("Risposta OpenAI non valida");
            }
            OpenAiChatResponse.Choice choice = response.choices.get(0);
            if (choice.message == null || choice.message.content == null || choice.message.content.isBlank()) {
                throw new ExternalServiceException("Risposta OpenAI non valida");
            }
            return choice.message.content.trim();
        } catch (RestClientResponseException ex) {
            throw new ExternalServiceException("Errore OpenAI: " + ex.getStatusCode(), ex);
        }
    }

    private record OpenAiChatRequest(
        String model,
        List<ZyraChatMessage> messages,
        Double temperature
    ) {
    }

    private static class OpenAiChatResponse {
        private List<Choice> choices;

        public List<Choice> getChoices() {
            return choices;
        }

        public void setChoices(List<Choice> choices) {
            this.choices = choices;
        }

        private static class Choice {
            private Message message;

            public Message getMessage() {
                return message;
            }

            public void setMessage(Message message) {
                this.message = message;
            }
        }

        private static class Message {
            private String role;
            private String content;

            public String getRole() {
                return role;
            }

            public void setRole(String role) {
                this.role = role;
            }

            public String getContent() {
                return content;
            }

            public void setContent(String content) {
                this.content = content;
            }
        }
    }
}
