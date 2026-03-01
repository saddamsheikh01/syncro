package com.syncro.backend.domain.email.service;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.email.DeepLinkPaths;
import com.syncro.backend.domain.email.entity.EmailSentLog;
import com.syncro.backend.domain.email.entity.EmailType;
import com.syncro.backend.domain.email.entity.UserEmailPreference;
import com.syncro.backend.domain.email.repository.EmailSentLogRepository;
import com.syncro.backend.domain.email.repository.UserEmailPreferenceRepository;
import com.syncro.backend.domain.external.brevo.BrevoConfig;
import com.syncro.backend.domain.external.brevo.BrevoMailClient;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Sends transactional and notification emails via Brevo. Respects user preferences,
 * chat rate limit (max 1 email per X minutes), and adds a CTA deep link to every email.
 */
@Service
public class EmailNotificationService {

    private final UserRepository userRepository;
    private final UserEmailPreferenceRepository preferenceRepository;
    private final EmailSentLogRepository sentLogRepository;
    private final BrevoConfig brevoConfig;
    private final BrevoMailClient brevoMailClient;
    private final EntityManager entityManager;

    public EmailNotificationService(
        UserRepository userRepository,
        UserEmailPreferenceRepository preferenceRepository,
        EmailSentLogRepository sentLogRepository,
        BrevoConfig brevoConfig,
        BrevoMailClient brevoMailClient,
        EntityManager entityManager
    ) {
        this.userRepository = userRepository;
        this.preferenceRepository = preferenceRepository;
        this.sentLogRepository = sentLogRepository;
        this.brevoConfig = brevoConfig;
        this.brevoMailClient = brevoMailClient;
        this.entityManager = entityManager;
    }

    public String buildCtaUrl(String path, String query) {
        String base = brevoConfig.getFrontendBaseUrl();
        if (base == null || base.isBlank()) base = "https://syncroapp.it";
        base = base.replaceAll("/$", "");
        if (path == null) path = "";
        if (!path.startsWith("/")) path = "/" + path;
        String url = base + path;
        if (query != null && !query.isBlank()) url = url + "?" + query;
        return url;
    }

    @Transactional(readOnly = true)
    public UserEmailPreference getOrCreatePreferences(UUID userId) {
        return preferenceRepository.findById(userId).orElseGet(() -> {
            UserEmailPreference p = new UserEmailPreference();
            p.setUserId(userId);
            return p;
        });
    }

    @Transactional
    public UserEmailPreference getOrCreateAndSavePreferences(UUID userId) {
        Optional<UserEmailPreference> opt = preferenceRepository.findById(userId);
        if (opt.isPresent()) return opt.get();
        if (!userRepository.existsById(userId)) return new UserEmailPreference();
        UserEmailPreference p = new UserEmailPreference();
        p.setUser(userRepository.getReferenceById(userId));
        entityManager.persist(p);
        return p;
    }

    private boolean isCategoryEnabled(UserEmailPreference prefs, EmailType type) {
        if (prefs == null) return true;
        return switch (type) {
            case NEW_MESSAGE_OFFLINE, NO_CHAT_REMINDER_24H -> prefs.isChatEnabled();
            case CONNECTION_REQUEST_RECEIVED, CONNECTION_ACCEPTED -> prefs.isConnectionsEnabled();
            case NEW_MATCH, IMPROVED_MATCH, WEEKLY_MATCH_DIGEST -> prefs.isMatchEnabled();
            case NEW_EVENT_NEARBY, SAVED_EVENT_REMINDER, WEEKLY_EVENTS_DIGEST -> prefs.isEventsEnabled();
            case COMMENT_RECEIVED, REACTION_RECEIVED, MENTION_TAG -> prefs.isFeedMomentsEnabled();
            case NEW_LOGIN_DEVICE_COUNTRY -> prefs.isSecurityEnabled();
            case NEW_TEST_AVAILABLE, TEST_STARTED_NOT_COMPLETED, INCOMPLETE_PROFILE_REMINDER -> prefs.isTestsProfileEnabled();
            default -> true;
        };
    }

    private boolean passesChatRateLimit(UUID userId, UserEmailPreference prefs) {
        if (prefs == null) return true;
        int minMinutes = Math.max(1, prefs.getChatMinMinutesBetween());
        Instant after = Instant.now().minusSeconds(minMinutes * 60L);
        return !sentLogRepository.existsByUserIdAndEmailTypeAndSentAtAfter(userId, EmailType.NEW_MESSAGE_OFFLINE, after);
    }

    /** Only send NEW_MESSAGE_OFFLINE if recipient has been inactive for >= chatMinMinutesBetween. */
    private boolean passesInactivityCheck(UUID recipientUserId, UserEmailPreference prefs) {
        if (prefs == null) return true;
        User user = userRepository.findById(recipientUserId).orElse(null);
        if (user == null) return true;
        Instant lastActive = user.getLastActiveAt();
        if (lastActive == null) return true;
        int minMinutes = Math.max(1, prefs.getChatMinMinutesBetween());
        Instant threshold = Instant.now().minusSeconds(minMinutes * 60L);
        return lastActive.isBefore(threshold);
    }

    @Transactional(readOnly = true)
    public boolean shouldSendEmail(UUID userId, EmailType type, UUID referenceId) {
        UserEmailPreference prefs = getOrCreatePreferences(userId);
        if (!isCategoryEnabled(prefs, type)) return false;
        if (type == EmailType.NEW_MESSAGE_OFFLINE) {
            if (!passesChatRateLimit(userId, prefs)) return false;
            if (!passesInactivityCheck(userId, prefs)) return false;
        }
        return true;
    }

    @Transactional
    public void recordSent(UUID userId, EmailType type, UUID referenceId) {
        EmailSentLog logEntry = new EmailSentLog();
        logEntry.setUserId(userId);
        logEntry.setEmailType(type);
        logEntry.setReferenceId(referenceId);
        sentLogRepository.save(logEntry);
    }

    private void sendWithTemplate(UUID userId, EmailType type, UUID referenceId, long templateId, Map<String, Object> params) {
        if (templateId <= 0 || !brevoConfig.isConfigured()) {
            return;
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) return;
        if (!shouldSendEmail(userId, type, referenceId)) return;
        try {
            if (!params.containsKey("first_name")) params.put("first_name", user.getUsername() != null ? user.getUsername() : "there");
            brevoMailClient.sendTransactionalEmail(user.getEmail(), templateId, params);
            recordSent(userId, type, referenceId);
        } catch (Exception e) {
        }
    }

    public void sendWelcome(UUID userId) {
        long tid = brevoConfig.getTemplateId(EmailType.WELCOME.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.PROFILE, null));
        sendWithTemplate(userId, EmailType.WELCOME, null, tid, params);
    }

    public void sendWelcomeIfFirstVisit(UUID userId) {
        if (sentLogRepository.existsByUserIdAndEmailType(userId, EmailType.WELCOME)) {
            return;
        }
        sendWelcome(userId);
    }

    public void sendRegistrationConfirmation(UUID userId, String verificationLink) {
        long tid = brevoConfig.getTemplateId(EmailType.REGISTRATION_CONFIRMATION.name());
        if (tid <= 0) tid = brevoConfig.getTemplateId("EMAIL_VERIFICATION");
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("cta_url", verificationLink != null ? verificationLink : buildCtaUrl(DeepLinkPaths.HOME, null));
        sendWithTemplate(userId, EmailType.REGISTRATION_CONFIRMATION, null, tid, params);
    }

    public void sendPasswordChangeNotification(UUID userId) {
        long tid = brevoConfig.getTemplateId(EmailType.PASSWORD_CHANGE.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.SETTINGS_NOTIFICATIONS, null));
        sendWithTemplate(userId, EmailType.PASSWORD_CHANGE, null, tid, params);
    }

    public void sendEmailChangeNotification(UUID userId, String newEmail) {
        long tid = brevoConfig.getTemplateId(EmailType.EMAIL_CHANGE.name());
        if (tid <= 0) {
            return;
        }
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.SETTINGS_NOTIFICATIONS, null));
        if (newEmail != null) params.put("new_email", newEmail);
        sendWithTemplate(userId, EmailType.EMAIL_CHANGE, null, tid, params);
    }

    public void sendConnectionRequestReceived(UUID recipientUserId, String actorDisplayName, UUID connectionId) {
        long tid = brevoConfig.getTemplateId(EmailType.CONNECTION_REQUEST_RECEIVED.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("actor_display_name", actorDisplayName != null ? actorDisplayName : "Someone");
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.CONNECTIONS, null));
        sendWithTemplate(recipientUserId, EmailType.CONNECTION_REQUEST_RECEIVED, connectionId, tid, params);
    }

    public void sendConnectionAccepted(UUID recipientUserId, String actorDisplayName, UUID connectionId) {
        long tid = brevoConfig.getTemplateId(EmailType.CONNECTION_ACCEPTED.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("actor_display_name", actorDisplayName != null ? actorDisplayName : "Someone");
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.CHAT, null));
        sendWithTemplate(recipientUserId, EmailType.CONNECTION_ACCEPTED, connectionId, tid, params);
    }

    public void sendNewMessageWhenOffline(UUID recipientUserId, String senderDisplayName, UUID conversationId) {
        long tid = brevoConfig.getTemplateId(EmailType.NEW_MESSAGE_OFFLINE.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("sender_display_name", senderDisplayName != null ? senderDisplayName : "Someone");
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.CHAT, conversationId != null ? "id=" + conversationId : null));
        sendWithTemplate(recipientUserId, EmailType.NEW_MESSAGE_OFFLINE, conversationId, tid, params);
    }

    public void sendNoChatReminder24h(UUID userId, String otherDisplayName, UUID connectionId) {
        long tid = brevoConfig.getTemplateId(EmailType.NO_CHAT_REMINDER_24H.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("other_display_name", otherDisplayName != null ? otherDisplayName : "your new connection");
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.CHAT, null));
        sendWithTemplate(userId, EmailType.NO_CHAT_REMINDER_24H, connectionId, tid, params);
    }

    public void sendNewMatch(UUID userId, String matchDisplayName, double compatibilityPercent, UUID matchUserId) {
        long tid = brevoConfig.getTemplateId(EmailType.NEW_MATCH.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("match_display_name", matchDisplayName != null ? matchDisplayName : "A new match");
        params.put("compatibility_percent", String.format("%.0f", compatibilityPercent));
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.MATCHES, null));
        sendWithTemplate(userId, EmailType.NEW_MATCH, matchUserId, tid, params);
    }

    public void sendImprovedMatch(UUID userId, String matchDisplayName, double oldPercent, double newPercent, UUID matchUserId) {
        long tid = brevoConfig.getTemplateId(EmailType.IMPROVED_MATCH.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("match_display_name", matchDisplayName != null ? matchDisplayName : "A match");
        params.put("old_percent", String.format("%.0f", oldPercent));
        params.put("new_percent", String.format("%.0f", newPercent));
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.MATCHES, null));
        sendWithTemplate(userId, EmailType.IMPROVED_MATCH, matchUserId, tid, params);
    }

    public void sendWeeklyMatchDigest(UUID userId, String topMatchesSummary) {
        UserEmailPreference prefs = getOrCreatePreferences(userId);
        if (!prefs.isDigestEnabled()) return;
        long tid = brevoConfig.getTemplateId(EmailType.WEEKLY_MATCH_DIGEST.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("top_matches_summary", topMatchesSummary != null ? topMatchesSummary : "Your top matches this week");
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.MATCHES, null));
        sendWithTemplate(userId, EmailType.WEEKLY_MATCH_DIGEST, null, tid, params);
    }

    public void sendNewTestAvailable(UUID userId) {
        long tid = brevoConfig.getTemplateId(EmailType.NEW_TEST_AVAILABLE.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.TESTS, null));
        sendWithTemplate(userId, EmailType.NEW_TEST_AVAILABLE, null, tid, params);
    }

    public void sendTestStartedNotCompleted(UUID userId, String testTitle) {
        long tid = brevoConfig.getTemplateId(EmailType.TEST_STARTED_NOT_COMPLETED.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("test_title", testTitle != null ? testTitle : "your test");
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.TESTS, null));
        sendWithTemplate(userId, EmailType.TEST_STARTED_NOT_COMPLETED, null, tid, params);
    }

    public void sendIncompleteProfileReminder(UUID userId) {
        long tid = brevoConfig.getTemplateId(EmailType.INCOMPLETE_PROFILE_REMINDER.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.PROFILE, null));
        sendWithTemplate(userId, EmailType.INCOMPLETE_PROFILE_REMINDER, null, tid, params);
    }

    public void sendNewEventNearby(UUID userId, String eventTitle, String city, UUID eventId) {
        long tid = brevoConfig.getTemplateId(EmailType.NEW_EVENT_NEARBY.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("event_title", eventTitle != null ? eventTitle : "An event");
        params.put("city", city != null ? city : "your area");
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.EVENTS, eventId != null ? "id=" + eventId : null));
        sendWithTemplate(userId, EmailType.NEW_EVENT_NEARBY, eventId, tid, params);
    }

    public void sendSavedEventReminder(UUID userId, String eventTitle, String eventDate, UUID eventId) {
        long tid = brevoConfig.getTemplateId(EmailType.SAVED_EVENT_REMINDER.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("event_title", eventTitle != null ? eventTitle : "Saved event");
        params.put("event_date", eventDate != null ? eventDate : "");
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.EVENTS, eventId != null ? "id=" + eventId : null));
        sendWithTemplate(userId, EmailType.SAVED_EVENT_REMINDER, eventId, tid, params);
    }

    public void sendWeeklyEventsDigest(UUID userId, String digestSummary) {
        UserEmailPreference prefs = getOrCreatePreferences(userId);
        if (!prefs.isContentWeeklyDigest()) return;
        long tid = brevoConfig.getTemplateId(EmailType.WEEKLY_EVENTS_DIGEST.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("digest_summary", digestSummary != null ? digestSummary : "Updates in your area");
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.EVENTS, null));
        sendWithTemplate(userId, EmailType.WEEKLY_EVENTS_DIGEST, null, tid, params);
    }

    public void sendCommentReceived(UUID recipientUserId, String actorDisplayName, UUID postId) {
        long tid = brevoConfig.getTemplateId(EmailType.COMMENT_RECEIVED.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("actor_display_name", actorDisplayName != null ? actorDisplayName : "Someone");
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.MOMENTS, postId != null ? "post=" + postId : null));
        sendWithTemplate(recipientUserId, EmailType.COMMENT_RECEIVED, postId, tid, params);
    }

    public void sendReactionReceived(UUID recipientUserId, String actorDisplayName, UUID postId) {
        long tid = brevoConfig.getTemplateId(EmailType.REACTION_RECEIVED.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("actor_display_name", actorDisplayName != null ? actorDisplayName : "Someone");
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.MOMENTS, postId != null ? "post=" + postId : null));
        sendWithTemplate(recipientUserId, EmailType.REACTION_RECEIVED, postId, tid, params);
    }

    public void sendMentionTag(UUID recipientUserId, String actorDisplayName, UUID postId) {
        long tid = brevoConfig.getTemplateId(EmailType.MENTION_TAG.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("actor_display_name", actorDisplayName != null ? actorDisplayName : "Someone");
        params.put("cta_url", buildCtaUrl(DeepLinkPaths.MOMENTS, postId != null ? "post=" + postId : null));
        sendWithTemplate(recipientUserId, EmailType.MENTION_TAG, postId, tid, params);
    }

    public void sendNewLoginDeviceCountry(UUID userId, String deviceOrCountry, String ctaUrl) {
        long tid = brevoConfig.getTemplateId(EmailType.NEW_LOGIN_DEVICE_COUNTRY.name());
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("device_or_country", deviceOrCountry != null ? deviceOrCountry : "a new device or location");
        params.put("cta_url", ctaUrl != null && !ctaUrl.isBlank() ? ctaUrl : buildCtaUrl(DeepLinkPaths.SETTINGS_NOTIFICATIONS, null));
        sendWithTemplate(userId, EmailType.NEW_LOGIN_DEVICE_COUNTRY, null, tid, params);
    }
}
