package com.syncro.backend.domain.zyra.config;

public enum PromptType {
    SYSTEM_BASE("prompts/system-base.txt"),
    CHAT_CONTEXT_TEMPLATE("prompts/chat/context-template.txt"),
    CHAT_SESSION_TITLE("prompts/chat/session-title.txt"),
    PROFILE_RECAP("prompts/recap/profile-recap.txt"),
    PROFILE_RECAP_SYSTEM("prompts/recap/profile-system.txt"),
    PLACE_RECAP("prompts/recap/place-recap.txt"),
    PLACE_RECAP_SYSTEM("prompts/recap/place-system.txt"),
    TEST_RECAP("prompts/recap/test-recap.txt"),
    TEST_RECAP_SYSTEM("prompts/recap/test-system.txt"),
    CHAT_RECAP("prompts/recap/chat-recap.txt"),
    CHAT_RECAP_SYSTEM("prompts/recap/chat-system.txt"),
    BIRTH_CHART_INTERPRETATION_SYSTEM("prompts/recap/birth-chart-interpretation-system.txt"),
    BIRTH_CHART_INTERPRETATION_USER("prompts/recap/birth-chart-interpretation-user.txt"),
    RECAP_TRANSLATE_SYSTEM("prompts/translation/recap-translate-system.txt"),
    RECAP_TRANSLATE_USER("prompts/translation/recap-translate-user.txt"),
    SUGGESTION_BASE("prompts/suggestions/suggestion-base.txt");

    private final String path;

    PromptType(String path) {
        this.path = path;
    }

    public String getPath() {
        return path;
    }
}
