package com.syncro.backend.domain.email.job;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.entity.UserStatus;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.catalog.entity.Experience;
import com.syncro.backend.domain.catalog.repository.ExperienceRepository;
import com.syncro.backend.domain.email.entity.UserEmailPreference;
import com.syncro.backend.domain.email.repository.UserEmailPreferenceRepository;
import com.syncro.backend.domain.email.service.EmailNotificationService;
import com.syncro.backend.domain.favorites.entity.UserFavorite;
import com.syncro.backend.domain.favorites.repository.UserFavoriteRepository;
import com.syncro.backend.domain.matchmaking.entity.UserMatchScore;
import com.syncro.backend.domain.matchmaking.repository.UserMatchScoreRepository;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.domain.social.entity.Connection;
import com.syncro.backend.domain.social.entity.ConnectionStatus;
import com.syncro.backend.domain.social.repository.ChatMessageRepository;
import com.syncro.backend.domain.social.repository.ChatParticipantRepository;
import com.syncro.backend.domain.social.repository.ConnectionRepository;
import com.syncro.backend.domain.tests.entity.TestDefinition;
import com.syncro.backend.domain.tests.entity.UserTestSubmission;
import com.syncro.backend.domain.tests.repository.TestQuestionRepository;
import com.syncro.backend.domain.tests.repository.UserTestAnswerRepository;
import com.syncro.backend.domain.tests.repository.UserTestSubmissionRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled jobs for email notifications:
 * - No chat within 24h after connection: remind user to start a conversation
 * - Weekly match digest: top 3 matches
 * - Test started but not completed
 * - Incomplete profile reminder
 * - Saved event reminder
 * - Weekly events/content digest (when content_weekly_digest is enabled)
 */
@Component
public class EmailScheduledJobs {

    private static final Logger log = LoggerFactory.getLogger(EmailScheduledJobs.class);
    private static final int NO_CHAT_WINDOW_HOURS = 24;
    private static final int TEST_INCOMPLETE_HOURS = 24;
    private static final double PROFILE_COMPLETION_THRESHOLD = 0.5;
    private static final int WEEKLY_DIGEST_DAYS = 7;
    private static final int PAGE_SIZE = 500;

    private final EmailNotificationService emailNotificationService;
    private final ConnectionRepository connectionRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserEmailPreferenceRepository userEmailPreferenceRepository;
    private final UserMatchScoreRepository userMatchScoreRepository;
    private final UserTestSubmissionRepository userTestSubmissionRepository;
    private final UserTestAnswerRepository userTestAnswerRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final UserFavoriteRepository userFavoriteRepository;
    private final ExperienceRepository experienceRepository;

    public EmailScheduledJobs(
        EmailNotificationService emailNotificationService,
        ConnectionRepository connectionRepository,
        ChatParticipantRepository chatParticipantRepository,
        ChatMessageRepository chatMessageRepository,
        UserRepository userRepository,
        UserProfileRepository userProfileRepository,
        UserEmailPreferenceRepository userEmailPreferenceRepository,
        UserMatchScoreRepository userMatchScoreRepository,
        UserTestSubmissionRepository userTestSubmissionRepository,
        UserTestAnswerRepository userTestAnswerRepository,
        TestQuestionRepository testQuestionRepository,
        UserFavoriteRepository userFavoriteRepository,
        ExperienceRepository experienceRepository
    ) {
        this.emailNotificationService = emailNotificationService;
        this.connectionRepository = connectionRepository;
        this.chatParticipantRepository = chatParticipantRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.userEmailPreferenceRepository = userEmailPreferenceRepository;
        this.userMatchScoreRepository = userMatchScoreRepository;
        this.userTestSubmissionRepository = userTestSubmissionRepository;
        this.userTestAnswerRepository = userTestAnswerRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.userFavoriteRepository = userFavoriteRepository;
        this.experienceRepository = experienceRepository;
    }

    /** Run daily: find connections accepted 24h ago with no first message; send reminder to both users. */
    @Scheduled(cron = "${app.email.jobs.no-chat-reminder-cron:0 0 10 * * ?}")
    public void noChatReminder24h() {
        log.debug("No-chat 24h reminder job running");
        Instant now = Instant.now();
        Instant from = now.minus(NO_CHAT_WINDOW_HOURS + 1, ChronoUnit.HOURS);
        Instant to = now.minus(NO_CHAT_WINDOW_HOURS, ChronoUnit.HOURS);
        int page = 0;
        Page<Connection> connectionPage;
        do {
            connectionPage = connectionRepository.findByStatusAndUpdatedAtBetween(
                ConnectionStatus.ACCEPTED, from, to, PageRequest.of(page, PAGE_SIZE)
            );
            for (Connection c : connectionPage.getContent()) {
                UUID userA = c.getFromUserId();
                UUID userB = c.getToUserId();
                UUID convId;
                try {
                    convId = chatParticipantRepository.findPrivateConversationId(userA, userB);
                } catch (Exception e) {
                    convId = null;
                }
                if (convId == null) {
                    sendNoChatReminderToBoth(userA, userB, c.getId());
                    continue;
                }
                long messageCount = chatMessageRepository.countByConversationId(convId);
                if (messageCount == 0) {
                    sendNoChatReminderToBoth(userA, userB, c.getId());
                }
            }
            page++;
        } while (connectionPage.hasNext());
    }

    private void sendNoChatReminderToBoth(UUID userA, UUID userB, UUID connectionId) {
        String displayA = resolveDisplayName(userA);
        String displayB = resolveDisplayName(userB);
        try {
            emailNotificationService.sendNoChatReminder24h(userA, displayB, connectionId);
        } catch (Exception e) {
            log.warn("No-chat reminder send failed for user {}: {}", userA, e.getMessage());
        }
        try {
            emailNotificationService.sendNoChatReminder24h(userB, displayA, connectionId);
        } catch (Exception e) {
            log.warn("No-chat reminder send failed for user {}: {}", userB, e.getMessage());
        }
    }

    /** Run weekly (e.g. Monday 9am): top 3 matches per user with digest_enabled. */
    @Scheduled(cron = "${app.email.jobs.weekly-match-digest-cron:0 0 9 ? * MON}")
    public void weeklyMatchDigest() {
        log.debug("Weekly match digest job running");
        int page = 0;
        Page<UserEmailPreference> prefsPage;
        do {
            prefsPage = userEmailPreferenceRepository.findByDigestEnabledTrue(PageRequest.of(page, PAGE_SIZE));
            for (UserEmailPreference p : prefsPage.getContent()) {
                UUID userId = p.getUserId();
                List<UserMatchScore> top = userMatchScoreRepository.findTopMatchesForUser(
                    userId, PageRequest.of(0, 3)
                );
                if (top.isEmpty()) continue;
                List<String> lines = new ArrayList<>();
                for (UserMatchScore m : top) {
                    UUID otherId = m.getUserAId().equals(userId) ? m.getUserBId() : m.getUserAId();
                    String name = resolveDisplayName(otherId);
                    int score = m.getScoreTotal() != null ? m.getScoreTotal() : 0;
                    lines.add(String.format("%s (%d%%)", name != null ? name : "Match", score));
                }
                String summary = String.join(", ", lines);
                try {
                    emailNotificationService.sendWeeklyMatchDigest(userId, summary);
                } catch (Exception e) {
                    log.warn("Weekly match digest send failed for user {}: {}", userId, e.getMessage());
                }
            }
            page++;
        } while (prefsPage.hasNext());
    }

    /** Run daily: users who started a test but did not complete it (submission older than 24h with fewer answers than questions). */
    @Scheduled(cron = "${app.email.jobs.test-not-completed-cron:0 0 11 * * ?}")
    public void testStartedNotCompleted() {
        log.debug("Test not completed reminder job running");
        Instant cutoff = Instant.now().minus(TEST_INCOMPLETE_HOURS, ChronoUnit.HOURS);
        int page = 0;
        Page<UserTestSubmission> submissionsPage;
        do {
            submissionsPage = userTestSubmissionRepository.findBySubmittedAtBefore(cutoff, PageRequest.of(page, PAGE_SIZE));
            for (UserTestSubmission sub : submissionsPage.getContent()) {
                TestDefinition test = sub.getTestDefinition();
                if (test == null) continue;
                int questionCount = testQuestionRepository.findByTestDefinitionIdOrderByPositionAsc(test.getId()).size();
                long answerCount = userTestAnswerRepository.countBySubmission_Id(sub.getId());
                if (answerCount >= questionCount) continue;
                String testTitle = test.getTitle();
                UUID userId = sub.getUser().getId();
                try {
                    emailNotificationService.sendTestStartedNotCompleted(userId, testTitle);
                } catch (Exception e) {
                    log.warn("Test not completed reminder send failed for user {}: {}", userId, e.getMessage());
                }
            }
            page++;
        } while (submissionsPage.hasNext());
    }

    /** Run daily: users with low profile completion (profile &lt; 50%). Sends to all active users with incomplete profiles. */
    @Scheduled(cron = "${app.email.jobs.incomplete-profile-cron:0 0 0/3 * * ?}")
    public void incompleteProfileReminder() {
        log.info("Incomplete profile reminder job running");
        int page = 0;
        int totalEligible = 0;
        Page<User> userPage;
        do {
            userPage = userRepository.findByStatus(UserStatus.ACTIVE, PageRequest.of(page, PAGE_SIZE));
            var eligible = userPage.getContent().stream()
                .filter(u -> computeProfileCompletion(u.getId()) < PROFILE_COMPLETION_THRESHOLD)
                .toList();
            for (var u : eligible) {
                try {
                    emailNotificationService.sendIncompleteProfileReminder(u.getId());
                    totalEligible++;
                } catch (Exception e) {
                    log.warn("Incomplete profile reminder send failed for user {}: {}", u.getId(), e.getMessage());
                }
            }
            page++;
        } while (userPage.hasNext());
        log.info("Incomplete profile job done: {} emails sent to users with profile < 50%", totalEligible);
    }

    private double computeProfileCompletion(UUID userId) {
        Optional<UserProfile> opt = userProfileRepository.findByUserId(userId);
        if (opt.isEmpty()) return 0;
        UserProfile p = opt.get();
        int filled = 0;
        int total = 10;
        if (p.getFullName() != null && !p.getFullName().isBlank()) filled++;
        if (p.getCity() != null && !p.getCity().isBlank()) filled++;
        if (p.getCountry() != null && !p.getCountry().isBlank()) filled++;
        if (p.getBirthDate() != null) filled++;
        if (p.getGender() != null) filled++;
        if (p.getBio() != null && !p.getBio().isBlank()) filled++;
        if (p.getJobTitle() != null && !p.getJobTitle().isBlank()) filled++;
        if (p.getRelationshipStatus() != null) filled++;
        if (p.getVisibility() != null) filled++;
        if (p.getCreatedAt() != null) filled++; // has profile at all
        return (double) filled / total;
    }

    /** Run daily: saved experiences – remind users who have saved an experience (one per user, first favorite). */
    @Scheduled(cron = "${app.email.jobs.saved-event-reminder-cron:0 0 8 * * ?}")
    public void savedEventReminder() {
        log.debug("Saved event reminder job running");
        java.util.Map<UUID, UserFavorite> onePerUser = new java.util.LinkedHashMap<>();
        int page = 0;
        Page<UserFavorite> favoritesPage;
        do {
            favoritesPage = userFavoriteRepository.findByExperienceIdIsNotNull(PageRequest.of(page, PAGE_SIZE));
            for (UserFavorite uf : favoritesPage.getContent()) {
                onePerUser.putIfAbsent(uf.getUserId(), uf);
            }
            page++;
        } while (favoritesPage.hasNext());
        for (UserFavorite uf : onePerUser.values()) {
            UUID experienceId = uf.getExperienceId();
            if (experienceId == null) continue;
            Experience exp = experienceRepository.findById(experienceId).orElse(null);
            String title = exp != null ? exp.getName() : "Saved experience";
            String eventDate = exp != null && exp.getUpdatedAt() != null
                ? exp.getUpdatedAt().toString().substring(0, 10)
                : "";
            try {
                emailNotificationService.sendSavedEventReminder(uf.getUserId(), title, eventDate, experienceId);
            } catch (Exception e) {
                log.warn("Saved event reminder send failed for user {}: {}", uf.getUserId(), e.getMessage());
            }
        }
    }

    /** Run weekly: events/content updates in user's area (when content_weekly_digest). */
    @Scheduled(cron = "${app.email.jobs.weekly-events-digest-cron:0 0 9 ? * TUE}")
    public void weeklyEventsDigest() {
        log.debug("Weekly events digest job running");
        Instant since = Instant.now().minus(WEEKLY_DIGEST_DAYS, ChronoUnit.DAYS);
        int page = 0;
        Page<UserEmailPreference> prefsPage;
        do {
            prefsPage = userEmailPreferenceRepository.findByContentWeeklyDigestTrue(PageRequest.of(page, PAGE_SIZE));
            for (UserEmailPreference p : prefsPage.getContent()) {
                UUID userId = p.getUserId();
                Optional<UserProfile> profileOpt = userProfileRepository.findByUserId(userId);
                String city = profileOpt.map(UserProfile::getCity).orElse(null);
                if (city == null || city.isBlank()) continue;
                List<Experience> experiences = experienceRepository.findActiveByCityUpdatedSince(
                    city, since, PageRequest.of(0, 10)
                );
                if (experiences.isEmpty()) continue;
                List<String> lines = new ArrayList<>();
                for (Experience e : experiences) {
                    lines.add(e.getName() != null ? e.getName() : "Event");
                }
                String summary = String.join(", ", lines);
                try {
                    emailNotificationService.sendWeeklyEventsDigest(userId, summary);
                } catch (Exception e) {
                    log.warn("Weekly events digest send failed for user {}: {}", userId, e.getMessage());
                }
            }
            page++;
        } while (prefsPage.hasNext());
    }

    private String resolveDisplayName(UUID userId) {
        if (userId == null) return "User";
        Optional<UserProfile> profileOpt = userProfileRepository.findByUserId(userId);
        if (profileOpt.isPresent()) {
            String fn = profileOpt.get().getFullName();
            if (fn != null && !fn.isBlank()) return fn.trim();
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            if (user.getUsername() != null && !user.getUsername().isBlank()) return user.getUsername();
            if (user.getEmail() != null && !user.getEmail().isBlank()) return user.getEmail();
        }
        return "User";
    }
}
