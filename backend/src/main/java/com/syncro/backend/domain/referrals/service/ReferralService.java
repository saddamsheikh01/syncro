package com.syncro.backend.domain.referrals.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.ConflictException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.referrals.dto.AdminReferralCodeResponse;
import com.syncro.backend.domain.referrals.dto.AdminReferralDetailResponse;
import com.syncro.backend.domain.referrals.dto.AdminReferralUsageResponse;
import com.syncro.backend.domain.referrals.dto.ReferralLinkResponse;
import com.syncro.backend.domain.referrals.entity.ReferralCode;
import com.syncro.backend.domain.referrals.entity.ReferralUsage;
import com.syncro.backend.domain.referrals.repository.ReferralCodeRepository;
import com.syncro.backend.domain.referrals.repository.ReferralUsageRepository;
import com.syncro.backend.security.AdminPrincipal;
import com.syncro.backend.security.UserPrincipal;
import java.security.SecureRandom;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReferralService {

    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 8;
    private static final int MAX_ATTEMPTS = 10;

    private final ReferralCodeRepository referralCodeRepository;
    private final ReferralUsageRepository referralUsageRepository;
    private final UserRepository userRepository;
    private final SecureRandom random = new SecureRandom();

    public ReferralService(
        ReferralCodeRepository referralCodeRepository,
        ReferralUsageRepository referralUsageRepository,
        UserRepository userRepository
    ) {
        this.referralCodeRepository = referralCodeRepository;
        this.referralUsageRepository = referralUsageRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ReferralLinkResponse getOrCreateMyReferral(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        return getOrCreateReferralCode(principal.userId());
    }

    @Transactional
    public void registerReferralUsage(
        String rawCode,
        UUID invitedUserId,
        String ip,
        String userAgent
    ) {
        if (rawCode == null || rawCode.isBlank()) {
            return;
        }
        if (invitedUserId == null) {
            throw new BadRequestException("Utente invitato non valido");
        }

        String code = rawCode.trim().toUpperCase(Locale.ROOT);
        ReferralCode referralCode = referralCodeRepository.findByCode(code)
            .orElseThrow(() -> new NotFoundException("Referral non valido"));

        if (referralCode.getUserId() != null && referralCode.getUserId().equals(invitedUserId)) {
            throw new BadRequestException("Referral non valido");
        }
        if (referralUsageRepository.existsByInvitedUserId(invitedUserId)) {
            throw new ConflictException("Referral gia utilizzato");
        }

        ReferralUsage usage = new ReferralUsage();
        usage.setReferralCode(referralCode);
        usage.setInvitedUserId(invitedUserId);
        usage.setIp(ip);
        usage.setUserAgent(userAgent);
        referralUsageRepository.save(usage);
    }

    @Transactional(readOnly = true)
    public Page<AdminReferralCodeResponse> getReferralCodes(
        AdminPrincipal principal,
        int page,
        int size
    ) {
        requireAdmin(principal);
        PageRequest pageable = PageRequest.of(page, size);
        Page<ReferralCode> codes = referralCodeRepository.findAll(pageable);

        List<UUID> userIds = codes.getContent().stream()
            .map(ReferralCode::getUserId)
            .filter(id -> id != null)
            .toList();
        Map<UUID, User> users = loadUsers(userIds);

        return codes.map(code -> {
            User user = users.get(code.getUserId());
            return new AdminReferralCodeResponse(
                code.getUserId(),
                user != null ? user.getEmail() : null,
                user != null ? user.getUsername() : null,
                code.getCode(),
                code.getUsesCount() != null ? code.getUsesCount() : 0,
                code.getCreatedAt()
            );
        });
    }

    @Transactional(readOnly = true)
    public Page<AdminReferralUsageResponse> getReferralUsages(
        AdminPrincipal principal,
        String code,
        int page,
        int size
    ) {
        requireAdmin(principal);
        if (code == null || code.isBlank()) {
            throw new BadRequestException("Referral non valido");
        }
        ReferralCode referralCode = referralCodeRepository.findByCode(code.trim().toUpperCase(Locale.ROOT))
            .orElseThrow(() -> new NotFoundException("Referral non valido"));

        PageRequest pageable = PageRequest.of(page, size);
        Page<ReferralUsage> usages = referralUsageRepository
            .findByReferralCodeIdOrderByCreatedAtDesc(referralCode.getId(), pageable);

        List<UUID> invitedIds = usages.getContent().stream()
            .map(ReferralUsage::getInvitedUserId)
            .filter(id -> id != null)
            .toList();
        Map<UUID, User> users = loadUsers(invitedIds);

        return usages.map(usage -> {
            User user = users.get(usage.getInvitedUserId());
            return new AdminReferralUsageResponse(
                usage.getInvitedUserId(),
                user != null ? user.getEmail() : null,
                user != null ? user.getUsername() : null,
                usage.getCreatedAt(),
                usage.getIp(),
                usage.getUserAgent()
            );
        });
    }

    @Transactional(readOnly = true)
    public AdminReferralDetailResponse getReferralDetail(AdminPrincipal principal, String code) {
        requireAdmin(principal);
        if (code == null || code.isBlank()) {
            throw new BadRequestException("Referral non valido");
        }
        ReferralCode referralCode = referralCodeRepository.findByCode(code.trim().toUpperCase(Locale.ROOT))
            .orElseThrow(() -> new NotFoundException("Referral non valido"));

        User user = referralCode.getUserId() != null
            ? userRepository.findById(referralCode.getUserId()).orElse(null)
            : null;

        return new AdminReferralDetailResponse(
            referralCode.getUserId(),
            user != null ? user.getEmail() : null,
            user != null ? user.getUsername() : null,
            referralCode.getCode(),
            referralCode.getUsesCount() != null ? referralCode.getUsesCount() : 0,
            referralCode.getCreatedAt()
        );
    }

    private ReferralLinkResponse getOrCreateReferralCode(UUID userId) {
        if (userId == null) {
            throw new BadRequestException("Utente non valido");
        }
        ReferralCode existing = referralCodeRepository.findByUserId(userId).orElse(null);
        if (existing != null) {
            return toLinkResponse(existing);
        }

        ReferralCode created = new ReferralCode();
        created.setUserId(userId);
        created.setCode(generateUniqueCode());
        ReferralCode saved = referralCodeRepository.save(created);
        return toLinkResponse(saved);
    }

    private ReferralLinkResponse toLinkResponse(ReferralCode code) {
        return new ReferralLinkResponse(
            code.getCode(),
            code.getUsesCount() != null ? code.getUsesCount() : 0,
            code.getCreatedAt()
        );
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            String code = randomCode();
            if (!referralCodeRepository.existsByCode(code)) {
                return code;
            }
        }
        throw new ConflictException("Impossibile generare un referral univoco");
    }

    private String randomCode() {
        StringBuilder builder = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            int index = random.nextInt(CODE_ALPHABET.length());
            builder.append(CODE_ALPHABET.charAt(index));
        }
        return builder.toString();
    }

    private Map<UUID, User> loadUsers(List<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        List<User> users = userRepository.findAllById(userIds);
        return users.stream()
            .collect(Collectors.toMap(User::getId, user -> user, (a, b) -> a));
    }

    private void requireAdmin(AdminPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
    }
}
