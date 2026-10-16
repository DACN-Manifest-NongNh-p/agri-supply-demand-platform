package com.agrisupply.platform.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A Farmora account as Keycloak describes it, refreshed at each sign-in and by the admin's Keycloak sync.
 * Written by {@code UserService}; sign-in times stay empty for people who have not opened the app yet.
 */
@Entity
@Table(name = "app_user")
public class AppUser {

    @Id
    @Column(name = "keycloak_id", length = 36)
    private String keycloakId;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(length = 200)
    private String email;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

    @Column(name = "account_type", length = 20)
    private String accountType;

    /** Comma-separated Farmora roles. */
    @Column(nullable = false, length = 200)
    private String roles;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "registered_at")
    private Instant registeredAt;

    @Column(name = "first_seen_at")
    private Instant firstSeenAt;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    @Column(name = "synced_at")
    private Instant syncedAt;

    protected AppUser() {
    }

    public String getKeycloakId() {
        return keycloakId;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public String getAccountType() {
        return accountType;
    }

    public String getRoles() {
        return roles;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public Instant getRegisteredAt() {
        return registeredAt;
    }

    public Instant getSyncedAt() {
        return syncedAt;
    }

    public Instant getFirstSeenAt() {
        return firstSeenAt;
    }

    public Instant getLastSeenAt() {
        return lastSeenAt;
    }
}
