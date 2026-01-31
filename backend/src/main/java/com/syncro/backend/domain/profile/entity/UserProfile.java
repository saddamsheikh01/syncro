package com.syncro.backend.domain.profile.entity;

import com.syncro.backend.domain.auth.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "city")
    private String city;

    @Column(name = "country")
    private String country;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;

    @Enumerated(EnumType.STRING)
    @Column(name = "zodiac_sign")
    private ZodiacSign zodiacSign;

    @Enumerated(EnumType.STRING)
    @Column(name = "sun_sign")
    private ZodiacSign sunSign;

    @Enumerated(EnumType.STRING)
    @Column(name = "moon_sign")
    private ZodiacSign moonSign;

    @Enumerated(EnumType.STRING)
    @Column(name = "asc_sign")
    private ZodiacSign ascSign;

    @Enumerated(EnumType.STRING)
    @Column(name = "venus_sign")
    private ZodiacSign venusSign;

    @Enumerated(EnumType.STRING)
    @Column(name = "mars_sign")
    private ZodiacSign marsSign;

    @Column(name = "birth_place")
    private String birthPlace;

    @Column(name = "birth_time")
    private LocalTime birthTime;

    @Column(name = "job_title", length = 120)
    private String jobTitle;

    @Column(name = "company_name", length = 160)
    private String companyName;

    @Column(name = "bio", length = 500)
    private String bio;

    @Column(name = "traits_text", length = 500)
    private String traitsText;

    @Column(name = "loves_text", length = 500)
    private String lovesText;

    @Column(name = "dislikes_text", length = 500)
    private String dislikesText;

    @Column(name = "goals_text", length = 500)
    private String goalsText;

    @Column(name = "values_text", length = 500)
    private String valuesText;

    @Enumerated(EnumType.STRING)
    @Column(name = "relationship_status")
    private RelationshipStatus relationshipStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "orientation")
    private Orientation orientation;

    @Enumerated(EnumType.STRING)
    @Column(name = "children_status")
    private ChildrenStatus childrenStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", nullable = false)
    private ProfileVisibility visibility;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (visibility == null) {
            visibility = ProfileVisibility.PUBLIC;
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
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

    public Gender getGender() {
        return gender;
    }

    public void setGender(Gender gender) {
        this.gender = gender;
    }

    public ZodiacSign getZodiacSign() {
        return zodiacSign;
    }

    public void setZodiacSign(ZodiacSign zodiacSign) {
        this.zodiacSign = zodiacSign;
    }

    public ZodiacSign getSunSign() {
        return sunSign;
    }

    public void setSunSign(ZodiacSign sunSign) {
        this.sunSign = sunSign;
    }

    public ZodiacSign getMoonSign() {
        return moonSign;
    }

    public void setMoonSign(ZodiacSign moonSign) {
        this.moonSign = moonSign;
    }

    public ZodiacSign getAscSign() {
        return ascSign;
    }

    public void setAscSign(ZodiacSign ascSign) {
        this.ascSign = ascSign;
    }

    public ZodiacSign getVenusSign() {
        return venusSign;
    }

    public void setVenusSign(ZodiacSign venusSign) {
        this.venusSign = venusSign;
    }

    public ZodiacSign getMarsSign() {
        return marsSign;
    }

    public void setMarsSign(ZodiacSign marsSign) {
        this.marsSign = marsSign;
    }

    public String getBirthPlace() {
        return birthPlace;
    }

    public void setBirthPlace(String birthPlace) {
        this.birthPlace = birthPlace;
    }

    public LocalTime getBirthTime() {
        return birthTime;
    }

    public void setBirthTime(LocalTime birthTime) {
        this.birthTime = birthTime;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getTraitsText() {
        return traitsText;
    }

    public void setTraitsText(String traitsText) {
        this.traitsText = traitsText;
    }

    public String getLovesText() {
        return lovesText;
    }

    public void setLovesText(String lovesText) {
        this.lovesText = lovesText;
    }

    public String getDislikesText() {
        return dislikesText;
    }

    public void setDislikesText(String dislikesText) {
        this.dislikesText = dislikesText;
    }

    public String getGoalsText() {
        return goalsText;
    }

    public void setGoalsText(String goalsText) {
        this.goalsText = goalsText;
    }

    public String getValuesText() {
        return valuesText;
    }

    public void setValuesText(String valuesText) {
        this.valuesText = valuesText;
    }

    public RelationshipStatus getRelationshipStatus() {
        return relationshipStatus;
    }

    public void setRelationshipStatus(RelationshipStatus relationshipStatus) {
        this.relationshipStatus = relationshipStatus;
    }

    public Orientation getOrientation() {
        return orientation;
    }

    public void setOrientation(Orientation orientation) {
        this.orientation = orientation;
    }

    public ChildrenStatus getChildrenStatus() {
        return childrenStatus;
    }

    public void setChildrenStatus(ChildrenStatus childrenStatus) {
        this.childrenStatus = childrenStatus;
    }

    public ProfileVisibility getVisibility() {
        return visibility;
    }

    public void setVisibility(ProfileVisibility visibility) {
        this.visibility = visibility;
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
}
