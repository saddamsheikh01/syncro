package com.syncro.backend.domain.profile.repository;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.profile.entity.Gender;
import com.syncro.backend.domain.profile.entity.Orientation;
import com.syncro.backend.domain.profile.entity.ProfileVisibility;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.entity.ZodiacSign;
import com.syncro.backend.domain.tags.entity.UserInterest;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;
import java.text.Normalizer;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

public final class UserProfileSearchSpec {

    private UserProfileSearchSpec() {}

    private static String normalizeLocationFilter(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String t = value.trim();
        if (t.isEmpty()) {
            return null;
        }
        String lower = t.toLowerCase(Locale.ROOT);
        String nfd = Normalizer.normalize(lower, Normalizer.Form.NFD);
        return nfd.replaceAll("\\p{M}", "");
    }

    private static Predicate locationMatchWordBoundary(
        Expression<String> field,
        String normalizedTerm,
        CriteriaBuilder cb
    ) {
        String exact = normalizedTerm;
        String prefix = normalizedTerm + "%";
        String suffixEnd = "% " + normalizedTerm;
        String wordMiddle = "% " + normalizedTerm + " %";
        return cb.or(
            cb.equal(field, exact),
            cb.like(field, prefix),
            cb.like(field, suffixEnd),
            cb.like(field, wordMiddle)
        );
    }

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
        String valuesText,
        List<UUID> proximityUserIds,
        UUID excludeUserId
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("visibility"), visibility));

            if (excludeUserId != null) {
                predicates.add(cb.notEqual(root.get("user").get("id"), excludeUserId));
            }

            if (proximityUserIds != null && !proximityUserIds.isEmpty()) {
                predicates.add(root.get("user").get("id").in(proximityUserIds));
            }

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
                        cb.like(cb.lower(userJoin.get("username")), pattern),
                        cb.like(cb.lower(userJoin.get("email")), pattern)
                    ));
                }
            }

            if (city != null && !city.isBlank()) {
                String normalized = normalizeLocationFilter(city);
                if (normalized != null) {
                    var cityField = cb.lower(cb.coalesce(root.get("city"), cb.literal("")));
                    predicates.add(locationMatchWordBoundary(cityField, normalized, cb));
                }
            }

            if (country != null && !country.isBlank()) {
                String normalized = normalizeLocationFilter(country);
                if (normalized != null) {
                    var countryField = cb.lower(cb.coalesce(root.get("country"), cb.literal("")));
                    predicates.add(locationMatchWordBoundary(countryField, normalized, cb));
                }
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
                long requiredCount = interestTagIds.stream().distinct().count();
                if (requiredCount > 0) {
                    Subquery<UUID> sub = query.subquery(UUID.class);
                    var uiRoot = sub.from(UserInterest.class);
                    sub.where(uiRoot.get("tagId").in(interestTagIds));
                    sub.groupBy(uiRoot.get("userId"));
                    sub.having(cb.equal(cb.countDistinct(uiRoot.get("tagId")), requiredCount));
                    sub.select(uiRoot.get("userId"));
                    predicates.add(root.get("user").get("id").in(sub));
                }
            }

            if (valuesText != null && !valuesText.isBlank()) {
                String valuesPattern = "%" + valuesText.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("valuesText")), valuesPattern));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
