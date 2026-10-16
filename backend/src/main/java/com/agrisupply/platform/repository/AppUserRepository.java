package com.agrisupply.platform.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.agrisupply.platform.domain.AppUser;

public interface AppUserRepository extends JpaRepository<AppUser, String> {

    /** Most recent visitors first, then people who never signed in, newest account first. */
    @Query("select u from AppUser u order by u.lastSeenAt desc nulls last, u.registeredAt desc nulls last, u.username")
    List<AppUser> findAllForAdmin();

    /** At sign-in: insert or refresh in one statement, so two first requests from the same user cannot collide. */
    @Modifying
    @Query(nativeQuery = true, value = """
            INSERT INTO app_user (keycloak_id, username, email, first_name, last_name, email_verified, account_type, roles, first_seen_at, last_seen_at)
            VALUES (:id, :username, :email, :firstName, :lastName, :emailVerified, :accountType, :roles, :now, :now)
            ON CONFLICT (keycloak_id) DO UPDATE SET
                username = EXCLUDED.username,
                email = EXCLUDED.email,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                email_verified = EXCLUDED.email_verified,
                account_type = EXCLUDED.account_type,
                roles = EXCLUDED.roles,
                first_seen_at = COALESCE(app_user.first_seen_at, EXCLUDED.first_seen_at),
                last_seen_at = EXCLUDED.last_seen_at
            """)
    void upsert(@Param("id") String id, @Param("username") String username, @Param("email") String email,
                @Param("firstName") String firstName, @Param("lastName") String lastName,
                @Param("emailVerified") boolean emailVerified, @Param("accountType") String accountType,
                @Param("roles") String roles, @Param("now") Instant now);

    /** From Keycloak's user list: refresh the account details and leave the sign-in times alone. */
    @Modifying
    @Query(nativeQuery = true, value = """
            INSERT INTO app_user (keycloak_id, username, email, first_name, last_name, email_verified, account_type, roles, enabled, registered_at, synced_at)
            VALUES (:id, :username, :email, :firstName, :lastName, :emailVerified, :accountType, :roles, :enabled, :registeredAt, :now)
            ON CONFLICT (keycloak_id) DO UPDATE SET
                username = EXCLUDED.username,
                email = EXCLUDED.email,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                email_verified = EXCLUDED.email_verified,
                account_type = EXCLUDED.account_type,
                roles = EXCLUDED.roles,
                enabled = EXCLUDED.enabled,
                registered_at = EXCLUDED.registered_at,
                synced_at = EXCLUDED.synced_at
            """)
    void upsertFromDirectory(@Param("id") String id, @Param("username") String username, @Param("email") String email,
                             @Param("firstName") String firstName, @Param("lastName") String lastName,
                             @Param("emailVerified") boolean emailVerified, @Param("accountType") String accountType,
                             @Param("roles") String roles, @Param("enabled") boolean enabled,
                             @Param("registeredAt") Instant registeredAt, @Param("now") Instant now);
}
