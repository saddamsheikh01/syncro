package com.syncro.backend.domain.zyra.cache;

import com.syncro.backend.config.ZyraProperties;
import com.syncro.backend.domain.zyra.dto.ZyraChatRecapResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class ZyraRecapCache {

    private final Map<RecapKey, TextRecapEntry> recapCache = new ConcurrentHashMap<>();
    private final Map<UUID, ChatRecapEntry> chatRecapCache = new ConcurrentHashMap<>();
    private final Duration profileTtl;
    private final Duration placeTtl;
    private final Duration chatTtl;
    private final int maxEntries;

    public ZyraRecapCache(ZyraProperties properties) {
        this.profileTtl = Duration.ofMinutes(properties.profileRecapCacheTtlMinutes());
        this.placeTtl = Duration.ofMinutes(properties.placeRecapCacheTtlMinutes());
        this.chatTtl = Duration.ofMinutes(properties.chatRecapCacheTtlMinutes());
        this.maxEntries = properties.recapCacheMaxEntries();
    }

    public Optional<TextRecapEntry> getProfileRecap(UUID userId) {
        return getRecap(new RecapKey(RecapType.PROFILE, userId, null));
    }

    public Optional<TextRecapEntry> getPlaceRecap(UUID userId, UUID placeId) {
        return getRecap(new RecapKey(RecapType.PLACE, userId, placeId));
    }

    public void putProfileRecap(UUID userId, String recap, Instant generatedAt) {
        putRecap(new RecapKey(RecapType.PROFILE, userId, null), recap, generatedAt, profileTtl);
    }

    public void putPlaceRecap(UUID userId, UUID placeId, String recap, Instant generatedAt) {
        putRecap(new RecapKey(RecapType.PLACE, userId, placeId), recap, generatedAt, placeTtl);
    }

    public Optional<ZyraChatRecapResponse> getChatRecap(UUID userId) {
        if (userId == null) {
            return Optional.empty();
        }
        ChatRecapEntry entry = chatRecapCache.get(userId);
        if (entry == null) {
            return Optional.empty();
        }
        if (isExpired(entry.expiresAt())) {
            chatRecapCache.remove(userId);
            return Optional.empty();
        }
        return Optional.of(entry.response());
    }

    public void putChatRecap(UUID userId, ZyraChatRecapResponse response) {
        if (userId == null || response == null) {
            return;
        }
        chatRecapCache.put(userId, new ChatRecapEntry(response, Instant.now().plus(chatTtl)));
        pruneChatCache();
    }

    public void invalidateUser(UUID userId) {
        if (userId == null) {
            return;
        }
        recapCache.keySet().removeIf(key -> userId.equals(key.userId()));
        chatRecapCache.remove(userId);
    }

    private Optional<TextRecapEntry> getRecap(RecapKey key) {
        if (key == null || key.userId() == null) {
            return Optional.empty();
        }
        TextRecapEntry entry = recapCache.get(key);
        if (entry == null) {
            return Optional.empty();
        }
        if (isExpired(entry.expiresAt())) {
            recapCache.remove(key);
            return Optional.empty();
        }
        return Optional.of(entry);
    }

    private void putRecap(RecapKey key, String recap, Instant generatedAt, Duration ttl) {
        if (key == null || key.userId() == null || recap == null) {
            return;
        }
        Instant now = Instant.now();
        Instant safeGeneratedAt = generatedAt != null ? generatedAt : now;
        recapCache.put(
            key,
            new TextRecapEntry(recap, safeGeneratedAt, now.plus(ttl))
        );
        pruneRecapCache();
    }

    private boolean isExpired(Instant expiresAt) {
        return expiresAt != null && expiresAt.isBefore(Instant.now());
    }

    private void pruneRecapCache() {
        if (recapCache.size() <= maxEntries) {
            return;
        }
        Instant now = Instant.now();
        recapCache.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
        if (recapCache.size() <= maxEntries) {
            return;
        }
        int overflow = recapCache.size() - maxEntries;
        Iterator<RecapKey> iterator = recapCache.keySet().iterator();
        while (overflow > 0 && iterator.hasNext()) {
            iterator.next();
            iterator.remove();
            overflow--;
        }
    }

    private void pruneChatCache() {
        if (chatRecapCache.size() <= maxEntries) {
            return;
        }
        Instant now = Instant.now();
        chatRecapCache.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
        if (chatRecapCache.size() <= maxEntries) {
            return;
        }
        int overflow = chatRecapCache.size() - maxEntries;
        Iterator<UUID> iterator = chatRecapCache.keySet().iterator();
        while (overflow > 0 && iterator.hasNext()) {
            iterator.next();
            iterator.remove();
            overflow--;
        }
    }

    public enum RecapType {
        PROFILE,
        PLACE
    }

    public record RecapKey(RecapType type, UUID userId, UUID resourceId) {
    }

    public record TextRecapEntry(String recap, Instant generatedAt, Instant expiresAt) {
    }

    public record ChatRecapEntry(ZyraChatRecapResponse response, Instant expiresAt) {
    }
}
