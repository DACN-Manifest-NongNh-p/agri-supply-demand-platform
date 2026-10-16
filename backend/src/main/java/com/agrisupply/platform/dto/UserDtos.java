package com.agrisupply.platform.dto;

import java.time.Instant;
import java.util.List;

/** Response bodies for the user API. */
public final class UserDtos {

    private UserDtos() {
    }

    /** firstSeenAt and lastSeenAt are null for people who have not opened the app yet. */
    public record UserView(String id, String username, String email, String firstName, String lastName,
                           boolean emailVerified, boolean enabled, String accountType, List<String> roles,
                           Instant registeredAt, Instant firstSeenAt, Instant lastSeenAt, Instant syncedAt) {
    }

    /** Result of reading Keycloak's user list: how many accounts it returned, and the updated table. */
    public record SyncResult(int fromKeycloak, Instant syncedAt, List<UserView> users) {
    }
}
