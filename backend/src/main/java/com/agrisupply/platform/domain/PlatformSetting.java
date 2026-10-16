package com.agrisupply.platform.domain;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** The changed value of one {@link PlatformRule}; rules without a row use their default. */
@Entity
@Table(name = "platform_setting")
public class PlatformSetting {

    @Id
    @Column(name = "setting_key", length = 60)
    private String key;

    @Column(name = "setting_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal value;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    protected PlatformSetting() {
    }

    public PlatformSetting(String key) {
        this.key = key;
    }

    public void update(BigDecimal value, String updatedBy) {
        this.value = value;
        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }

    public String getKey() {
        return key;
    }

    public BigDecimal getValue() {
        return value;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }
}
