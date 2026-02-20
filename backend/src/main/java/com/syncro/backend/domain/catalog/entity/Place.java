package com.syncro.backend.domain.catalog.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "places")
public class Place {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false)
    private CatalogSource source;

    // Google Maps
    @Column(name = "google_place_id")
    private String googlePlaceId;

    // Indirizzo
    @Column(name = "address", columnDefinition = "text")
    private String address;

    @Column(name = "city")
    private String city;

    @Column(name = "country")
    private String country;

    @Column(name = "postal_code")
    private String postalCode;

    // Contatti
    @Column(name = "phone")
    private String phone;

    @Column(name = "website", columnDefinition = "text")
    private String website;

    // Rating e recensioni Google
    @Column(name = "google_rating", precision = 2, scale = 1)
    private BigDecimal googleRating;

    @Column(name = "google_review_count")
    private Integer googleReviewCount;

    // Prezzo (0=Free, 1=Cheap, 2=Moderate, 3=Expensive, 4=Very Expensive)
    @Column(name = "price_level")
    private Integer priceLevel;

    // Media
    @Column(name = "image_url", columnDefinition = "text")
    private String imageUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "photos", columnDefinition = "jsonb")
    private List<String> photos;

    // Orari e info
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "opening_hours", columnDefinition = "jsonb")
    private Map<String, Object> openingHours;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "google_types", columnDefinition = "jsonb")
    private List<String> googleTypes;

    // Sync e stato
    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "last_synced_at")
    private Instant lastSyncedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (source == null) {
            source = CatalogSource.MANUAL;
        }
        if (isActive == null) {
            isActive = true;
        }
        if (photos == null) {
            photos = new ArrayList<>();
        }
        if (googleTypes == null) {
            googleTypes = new ArrayList<>();
        }
        if (googleReviewCount == null) {
            googleReviewCount = 0;
        }
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public CatalogSource getSource() {
        return source;
    }

    public void setSource(CatalogSource source) {
        this.source = source;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getGooglePlaceId() {
        return googlePlaceId;
    }

    public void setGooglePlaceId(String googlePlaceId) {
        this.googlePlaceId = googlePlaceId;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public BigDecimal getGoogleRating() {
        return googleRating;
    }

    public void setGoogleRating(BigDecimal googleRating) {
        this.googleRating = googleRating;
    }

    public Integer getGoogleReviewCount() {
        return googleReviewCount;
    }

    public void setGoogleReviewCount(Integer googleReviewCount) {
        this.googleReviewCount = googleReviewCount;
    }

    public Integer getPriceLevel() {
        return priceLevel;
    }

    public void setPriceLevel(Integer priceLevel) {
        this.priceLevel = priceLevel;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public List<String> getPhotos() {
        return photos;
    }

    public void setPhotos(List<String> photos) {
        this.photos = photos;
    }

    public Map<String, Object> getOpeningHours() {
        return openingHours;
    }

    public void setOpeningHours(Map<String, Object> openingHours) {
        this.openingHours = openingHours;
    }

    public List<String> getGoogleTypes() {
        return googleTypes;
    }

    public void setGoogleTypes(List<String> googleTypes) {
        this.googleTypes = googleTypes;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Instant getLastSyncedAt() {
        return lastSyncedAt;
    }

    public void setLastSyncedAt(Instant lastSyncedAt) {
        this.lastSyncedAt = lastSyncedAt;
    }
}
