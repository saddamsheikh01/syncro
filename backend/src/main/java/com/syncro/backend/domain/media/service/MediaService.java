package com.syncro.backend.domain.media.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.StorageException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.config.MediaProperties;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.catalog.repository.ExperienceRepository;
import com.syncro.backend.domain.catalog.repository.PlaceRepository;
import com.syncro.backend.domain.media.dto.MediaResponse;
import com.syncro.backend.domain.media.entity.MediaObject;
import com.syncro.backend.domain.media.entity.MediaOwnerType;
import com.syncro.backend.domain.media.entity.MediaType;
import com.syncro.backend.domain.media.entity.PostMedia;
import com.syncro.backend.domain.media.mapper.MediaMapper;
import com.syncro.backend.domain.media.repository.MediaObjectRepository;
import com.syncro.backend.domain.media.repository.PostMediaRepository;
import com.syncro.backend.domain.social.entity.Post;
import com.syncro.backend.domain.social.repository.PostRepository;
import com.syncro.backend.security.UserPrincipal;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MediaService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PlaceRepository placeRepository;
    private final ExperienceRepository experienceRepository;
    private final MediaObjectRepository mediaObjectRepository;
    private final PostMediaRepository postMediaRepository;
    private final MediaMapper mediaMapper;
    private final Path storageRoot;
    private final String baseUrl;

    public MediaService(
        UserRepository userRepository,
        PostRepository postRepository,
        PlaceRepository placeRepository,
        ExperienceRepository experienceRepository,
        MediaObjectRepository mediaObjectRepository,
        PostMediaRepository postMediaRepository,
        MediaMapper mediaMapper,
        MediaProperties mediaProperties
    ) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.placeRepository = placeRepository;
        this.experienceRepository = experienceRepository;
        this.mediaObjectRepository = mediaObjectRepository;
        this.postMediaRepository = postMediaRepository;
        this.mediaMapper = mediaMapper;
        this.storageRoot = resolveStorageRoot(mediaProperties.storageDir());
        this.baseUrl = normalizeBaseUrl(mediaProperties.baseUrl());
    }

    @Transactional
    public MediaResponse uploadMedia(
        UserPrincipal principal,
        String ownerTypeValue,
        UUID ownerId,
        MultipartFile file
    ) {
        User user = getUser(principal);
        MediaOwnerType ownerType = parseOwnerType(ownerTypeValue);
        if (ownerId == null) {
            throw new BadRequestException("Owner id non valido");
        }
        validateOwnership(user, ownerType, ownerId);
        MediaType mediaType = resolveMediaType(file);
        String relativePath = storeFile(ownerType, file);

        MediaObject media = new MediaObject();
        media.setUrl(buildUrl(relativePath));
        media.setMediaType(mediaType);
        media.setOwnerType(ownerType);
        media.setOwnerId(ownerId);

        MediaObject saved = mediaObjectRepository.save(media);

        if (ownerType == MediaOwnerType.POST) {
            PostMedia link = new PostMedia();
            link.setPostId(ownerId);
            link.setMediaId(saved.getId());
            postMediaRepository.save(link);
        }

        return mediaMapper.toResponse(saved);
    }

    @Transactional
    public MediaResponse uploadPostMedia(UserPrincipal principal, UUID postId, MultipartFile file) {
        return uploadMedia(principal, MediaOwnerType.POST.name(), postId, file);
    }

    @Transactional(readOnly = true)
    public Page<MediaResponse> listByOwner(
        UserPrincipal principal,
        String ownerTypeValue,
        UUID ownerId,
        int page,
        int size
    ) {
        getUser(principal);
        MediaOwnerType ownerType = parseOwnerType(ownerTypeValue);
        if (ownerId == null) {
            throw new BadRequestException("Owner id non valido");
        }
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return mediaObjectRepository.findByOwnerTypeAndOwnerId(ownerType, ownerId, pageable)
            .map(mediaMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<MediaResponse> listPostMedia(UserPrincipal principal, UUID postId, int page, int size) {
        getUser(principal);
        if (postId == null) {
            throw new BadRequestException("Post non valido");
        }
        if (!postRepository.existsById(postId)) {
            throw new NotFoundException("Post non trovato");
        }
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return postMediaRepository.findMediaByPostId(postId, pageable)
            .map(mediaMapper::toResponse);
    }

    private void validateOwnership(User user, MediaOwnerType ownerType, UUID ownerId) {
        switch (ownerType) {
            case USER_PROFILE -> {
                if (!user.getId().equals(ownerId)) {
                    throw new UnauthorizedException("Operazione non consentita");
                }
            }
            case POST -> {
                Post post = postRepository.findById(ownerId)
                    .orElseThrow(() -> new NotFoundException("Post non trovato"));
                if (!user.getId().equals(post.getUserId())) {
                    throw new UnauthorizedException("Operazione non consentita");
                }
            }
            case PLACE -> {
                if (!placeRepository.existsById(ownerId)) {
                    throw new NotFoundException("Luogo non trovato");
                }
            }
            case EXPERIENCE -> {
                if (!experienceRepository.existsById(ownerId)) {
                    throw new NotFoundException("Esperienza non trovata");
                }
            }
        }
    }

    private MediaOwnerType parseOwnerType(String value) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException("Owner type non valido");
        }
        try {
            return MediaOwnerType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Owner type non valido");
        }
    }

    private MediaType resolveMediaType(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File mancante");
        }
        String contentType = file.getContentType();
        if (contentType == null) {
            throw new BadRequestException("Tipo media non supportato");
        }
        if (contentType.startsWith("image/")) {
            return MediaType.IMAGE;
        }
        if (contentType.startsWith("video/")) {
            return MediaType.VIDEO;
        }
        throw new BadRequestException("Tipo media non supportato");
    }

    private String storeFile(MediaOwnerType ownerType, MultipartFile file) {
        String filename = buildFilename(file.getOriginalFilename());
        Path ownerDir = storageRoot.resolve(ownerType.getFolderName()).normalize();
        try {
            Files.createDirectories(ownerDir);
            Path target = ownerDir.resolve(filename).normalize();
            file.transferTo(target);
        } catch (IOException ex) {
            throw new StorageException("Errore durante il salvataggio del media", ex);
        }
        return ownerType.getFolderName() + "/" + filename;
    }

    private String buildFilename(String originalFilename) {
        String extension = extractExtension(originalFilename);
        String name = UUID.randomUUID().toString();
        if (extension == null || extension.isBlank()) {
            return name;
        }
        return name + "." + extension;
    }

    private String extractExtension(String filename) {
        if (filename == null) {
            return null;
        }
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == filename.length() - 1) {
            return null;
        }
        String raw = filename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
        String sanitized = raw.replaceAll("[^a-z0-9]", "");
        return sanitized.isBlank() ? null : sanitized;
    }

    private Path resolveStorageRoot(String storageDir) {
        if (storageDir == null || storageDir.isBlank()) {
            throw new StorageException("Storage media non configurato");
        }
        return Paths.get(storageDir).toAbsolutePath().normalize();
    }

    private String normalizeBaseUrl(String baseUrlValue) {
        if (baseUrlValue == null || baseUrlValue.isBlank()) {
            throw new StorageException("Base URL media non configurata");
        }
        String trimmed = baseUrlValue.trim();
        if (trimmed.endsWith("/")) {
            return trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private String buildUrl(String relativePath) {
        return baseUrl + "/" + relativePath;
    }

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        return userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }
}
