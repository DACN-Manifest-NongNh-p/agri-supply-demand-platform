package com.agrisupply.platform.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One piece of public page text an admin changed, e.g. {@code landing.hero.title}. */
@Entity
@Table(name = "site_content")
public class SiteContentEntry {

    @Id
    @Column(name = "content_key", length = 100)
    private String key;

    @Column(name = "content_value", nullable = false, columnDefinition = "TEXT")
    private String value;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    protected SiteContentEntry() {
    }

    public SiteContentEntry(String key) {
        this.key = key;
    }

    public void update(String value, String updatedBy) {
        this.value = value;
        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }

    public String getKey() {
        return key;
    }

    public String getValue() {
        return value;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }
}
