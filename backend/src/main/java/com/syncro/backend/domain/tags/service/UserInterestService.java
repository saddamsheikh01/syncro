package com.syncro.backend.domain.tags.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.tags.dto.TagResponse;
import com.syncro.backend.domain.tags.dto.UpdateUserInterestsRequest;
import com.syncro.backend.domain.tags.dto.UserInterestsResponse;
import com.syncro.backend.domain.tags.entity.Tag;
import com.syncro.backend.domain.tags.entity.UserInterest;
import com.syncro.backend.domain.tags.mapper.TagMapper;
import com.syncro.backend.domain.tags.repository.TagRepository;
import com.syncro.backend.domain.tags.repository.UserInterestRepository;
import com.syncro.backend.security.UserPrincipal;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserInterestService {

    private final UserRepository userRepository;
    private final TagRepository tagRepository;
    private final UserInterestRepository userInterestRepository;
    private final TagMapper tagMapper;

    public UserInterestService(
        UserRepository userRepository,
        TagRepository tagRepository,
        UserInterestRepository userInterestRepository,
        TagMapper tagMapper
    ) {
        this.userRepository = userRepository;
        this.tagRepository = tagRepository;
        this.userInterestRepository = userInterestRepository;
        this.tagMapper = tagMapper;
    }

    @Transactional(readOnly = true)
    public UserInterestsResponse getInterests(UserPrincipal principal) {
        User user = getUser(principal);
        List<UserInterest> interests = userInterestRepository.findAllByUserId(user.getId());
        if (interests.isEmpty()) {
            return new UserInterestsResponse(user.getId(), List.of());
        }
        List<UUID> tagIds = interests.stream()
            .map(UserInterest::getTagId)
            .toList();
        List<Tag> tags = tagRepository.findAllById(tagIds);
        return new UserInterestsResponse(user.getId(), mapTags(tags));
    }

    @Transactional
    public UserInterestsResponse updateInterests(
        UserPrincipal principal,
        UpdateUserInterestsRequest request
    ) {
        User user = getUser(principal);
        Set<UUID> uniqueIds = new LinkedHashSet<>(request.tagIds());
        List<Tag> tags = resolveTags(uniqueIds);
        userInterestRepository.deleteAllByUserId(user.getId());

        if (!tags.isEmpty()) {
            List<UserInterest> interests = tags.stream()
                .map(tag -> buildInterest(user, tag))
                .toList();
            userInterestRepository.saveAll(interests);
        }

        return new UserInterestsResponse(user.getId(), mapTags(tags));
    }

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        return userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }

    private List<Tag> resolveTags(Set<UUID> tagIds) {
        if (tagIds.isEmpty()) {
            return List.of();
        }
        List<Tag> tags = tagRepository.findAllById(tagIds);
        if (tags.size() != tagIds.size()) {
            Set<UUID> missing = new HashSet<>(tagIds);
            Set<UUID> found = tags.stream()
                .map(Tag::getId)
                .collect(Collectors.toSet());
            missing.removeAll(found);
            throw new NotFoundException("Tag non trovati: " + missing);
        }
        return tags;
    }

    private UserInterest buildInterest(User user, Tag tag) {
        UserInterest interest = new UserInterest();
        interest.setUser(user);
        interest.setTag(tag);
        return interest;
    }

    private List<TagResponse> mapTags(List<Tag> tags) {
        return tags.stream()
            .sorted(Comparator.comparing(Tag::getName, String.CASE_INSENSITIVE_ORDER))
            .map(tagMapper::toResponse)
            .toList();
    }
}
