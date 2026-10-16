package com.agrisupply.platform.domain;

import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A banner shown to chosen audiences while it is active and inside its optional time window. */
@Entity
@Table(name = "announcement")
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 280)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AnnouncementTone tone;

    @Convert(converter = AudienceSetConverter.class)
    @Column(nullable = false, length = 200)
    private Set<Audience> audiences = EnumSet.noneOf(Audience.class);

    @Column(name = "starts_at")
    private Instant startsAt;

    @Column(name = "ends_at")
    private Instant endsAt;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    public void update(String message, AnnouncementTone tone, Set<Audience> audiences, Instant startsAt, Instant endsAt, boolean active, String updatedBy) {
        this.message = message;
        this.tone = tone;
        this.audiences = EnumSet.copyOf(audiences);
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.active = active;
        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }

    /** Active, started (or no start), and not ended (or no end). */
    public boolean isLive(Instant now) {
        return active && (startsAt == null || !now.isBefore(startsAt)) && (endsAt == null || now.isBefore(endsAt));
    }

    public Long getId() {
        return id;
    }

    public String getMessage() {
        return message;
    }

    public AnnouncementTone getTone() {
        return tone;
    }

    public Set<Audience> getAudiences() {
        return audiences;
    }

    public Instant getStartsAt() {
        return startsAt;
    }

    public Instant getEndsAt() {
        return endsAt;
    }

    public boolean isActive() {
        return active;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }
}
