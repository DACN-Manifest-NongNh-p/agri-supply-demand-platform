package com.agrisupply.platform.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agrisupply.platform.dto.UserDtos.SyncResult;
import com.agrisupply.platform.dto.UserDtos.UserView;
import com.agrisupply.platform.service.UserService;

@RestController
public class UserController {

    private final UserService users;

    public UserController(UserService users) {
        this.users = users;
    }

    /** The signed-in user. Also records them in app_user; the frontend calls it once after each sign-in. */
    @GetMapping("/api/me")
    public UserView me(@AuthenticationPrincipal Jwt jwt) {
        return users.sync(jwt);
    }

    /** Every account in app_user: recent visitors first, then people who have not signed in yet. */
    @GetMapping("/api/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserView> all() {
        return users.all();
    }

    /** Copies every account from Keycloak's user list into app_user, then returns the table. */
    @PostMapping("/api/admin/users/sync")
    @PreAuthorize("hasRole('ADMIN')")
    public SyncResult sync() {
        return users.syncFromKeycloak();
    }
}
