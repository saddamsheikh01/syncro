package com.syncro.backend.domain.email;

/**
 * Frontend paths for email CTA deep links. All are relative to app.brevo.frontend-base-url.
 */
public final class DeepLinkPaths {
    public static final String RESET_PASSWORD = "/reset-password";
    public static final String HOME = "/home";
    public static final String PROFILE = "/profile";
    public static final String CONNECTIONS = "/connections";
    public static final String CHAT = "/chat";
    public static final String MATCHES = "/matches";
    public static final String EVENTS = "/experiences";
    public static final String MOMENTS = "/moments";
    public static final String TESTS = "/profile#insights";
    public static final String SETTINGS_NOTIFICATIONS = "/settings/notifications";

    private DeepLinkPaths() {}
}
