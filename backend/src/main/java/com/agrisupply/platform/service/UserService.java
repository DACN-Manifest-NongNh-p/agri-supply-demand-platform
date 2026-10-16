package com.agrisupply.platform.service;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.agrisupply.platform.domain.AppUser;
import com.agrisupply.platform.dto.UserDtos.SyncResult;
import com.agrisupply.platform.dto.UserDtos.UserView;
import com.agrisupply.platform.repository.AppUserRepository;

/**
 * Keeps {@code app_user} in step with Keycloak in two ways: each sign-in copies the user's details from their
 * token, and the admin's sync copies every account from Keycloak's user list (including people who have not
 * opened the app yet). Keycloak stays the source of truth; nothing is written back to it, and no password is stored.
 */
@Service
public class UserService {

    /** Keycloak realm roles that mean something in Farmora; default-roles-*, offline_access etc. are left out. */
    private static final Set<String> APP_ROLES = Set.of("BUYER", "PRODUCER", "LOGISTICS", "COORDINATOR", "ADMIN");

    private final AppUserRepository repository;
    private final KeycloakUserDirectory directory;

    public UserService(AppUserRepository repository, KeycloakUserDirectory directory) {
        this.repository = repository;
        this.directory = directory;
    }

    /** Records the signed-in user from their token and returns the stored row. */
    @Transactional
    public UserView sync(Jwt jwt) {
        String id = jwt.getSubject();
        String username = jwt.getClaimAsString("preferred_username");
        if (id == null || username == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The token has no user id or username");
        }
        repository.upsert(id, clip(username, 100), clip(jwt.getClaimAsString("email"), 200),
                clip(jwt.getClaimAsString("given_name"), 100), clip(jwt.getClaimAsString("family_name"), 100),
                Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified")), clip(jwt.getClaimAsString("account_type"), 20),
                String.join(",", appRoles(jwt)), Instant.now());
        return repository.findById(id).map(UserService::view).orElseThrow();
    }

    @Transactional(readOnly = true)
    public List<UserView> all() {
        return repository.findAllForAdmin().stream().map(UserService::view).toList();
    }

    /** Copies every Keycloak account into app_user. Accounts already deleted in Keycloak are left as they are. */
    @Transactional
    public SyncResult syncFromKeycloak() {
        List<KeycloakUserDirectory.DirectoryUser> accounts = directory.allUsers();
        Instant now = Instant.now();
        for (KeycloakUserDirectory.DirectoryUser account : accounts) {
            repository.upsertFromDirectory(account.id(), clip(account.username(), 100), clip(account.email(), 200),
                    clip(account.firstName(), 100), clip(account.lastName(), 100), account.emailVerified(),
                    clip(account.accountType(), 20), String.join(",", appRoles(account.realmRoles())), account.enabled(),
                    account.createdAt(), now);
        }
        return new SyncResult(accounts.size(), now, all());
    }

    static List<String> appRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess == null || !(realmAccess.get("roles") instanceof Collection<?> roles)) {
            return List.of();
        }
        return appRoles(roles.stream().filter(String.class::isInstance).map(String.class::cast).toList());
    }

    static List<String> appRoles(List<String> realmRoles) {
        return realmRoles.stream().filter(APP_ROLES::contains).sorted().toList();
    }

    private static String clip(String value, int max) {
        return value == null || value.length() <= max ? value : value.substring(0, max);
    }

    private static UserView view(AppUser user) {
        List<String> roles = user.getRoles().isEmpty() ? List.of() : Arrays.asList(user.getRoles().split(","));
        return new UserView(user.getKeycloakId(), user.getUsername(), user.getEmail(), user.getFirstName(), user.getLastName(),
                user.isEmailVerified(), user.isEnabled(), user.getAccountType(), roles,
                user.getRegisteredAt(), user.getFirstSeenAt(), user.getLastSeenAt(), user.getSyncedAt());
    }
}
