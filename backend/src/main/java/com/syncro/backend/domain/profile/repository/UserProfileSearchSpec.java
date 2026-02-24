package com.syncro.backend.domain.profile.repository;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.profile.entity.Gender;
import com.syncro.backend.domain.profile.entity.Orientation;
import com.syncro.backend.domain.profile.entity.ProfileVisibility;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.entity.ZodiacSign;
import com.syncro.backend.domain.tags.entity.UserInterest;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

public final class UserProfileSearchSpec {

    private UserProfileSearchSpec() {}

    public static Specification<UserProfile> withFilters(
        ProfileVisibility visibility,
        String q,
        String city,
        String country,
        Integer ageMin,
        Integer ageMax,
        Gender gender,
        Orientation orientation,
        ZodiacSign zodiacSign,
        List<UUID> interestTagIds,
        String valuesText
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("visibility"), visibility));

            if (q != null && !q.isBlank()) {
                String normalized = q.trim().toLowerCase();
                if (normalized.startsWith("@")) {
                    normalized = normalized.substring(1).trim();
                }
                if (!normalized.isEmpty()) {
                    String pattern = "%" + normalized + "%";
                    Join<UserProfile, User> userJoin = root.join("user");
                    predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), pattern),
                        cb.like(cb.lower(root.get("city")), pattern),
                        cb.like(cb.lower(userJoin.get("username")), pattern),
                        cb.like(cb.lower(userJoin.get("email")), pattern)
                    ));
                }
            }

            if (city != null && !city.isBlank()) {
                String cityPattern = "%" + city.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("city")), cityPattern));
            }

            if (country != null && !country.isBlank()) {
                String countryPattern = "%" + country.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("country")), countryPattern));
            }

            LocalDate today = LocalDate.now();
            if (ageMin != null && ageMin > 0) {
                LocalDate birthDateMax = today.minusYears(ageMin);
                predicates.add(cb.lessThanOrEqualTo(root.get("birthDate"), birthDateMax));
            }
            if (ageMax != null && ageMax > 0) {
                LocalDate birthDateMin = today.minusYears(ageMax + 1).plusDays(1);
                predicates.add(cb.greaterThanOrEqualTo(root.get("birthDate"), birthDateMin));
            }

            if (gender != null) {
                predicates.add(cb.equal(root.get("gender"), gender));
            }

            if (orientation != null) {
                predicates.add(cb.equal(root.get("orientation"), orientation));
            }

            if (zodiacSign != null && zodiacSign != ZodiacSign.UNKNOWN) {
                predicates.add(cb.equal(root.get("zodiacSign"), zodiacSign));
            }

            if (interestTagIds != null && !interestTagIds.isEmpty()) {
                Subquery<UUID> sub = query.subquery(UUID.class);
                var uiRoot = sub.from(UserInterest.class);
                sub.select(uiRoot.get("userId"));
                sub.where(uiRoot.get("tagId").in(interestTagIds));
                predicates.add(root.get("user").get("id").in(sub));
            }

            if (valuesText != null && !valuesText.isBlank()) {
                String valuesPattern = "%" + valuesText.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("valuesText")), valuesPattern));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
