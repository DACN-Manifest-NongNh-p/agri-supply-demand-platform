package com.agrisupply.platform.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.agrisupply.platform.config.KeycloakRoleConverter;
import com.agrisupply.platform.config.SecurityConfig;
import com.agrisupply.platform.dto.UserDtos.SyncResult;
import com.agrisupply.platform.dto.UserDtos.UserView;
import com.agrisupply.platform.service.UserService;

/** Any signed-in user can read (and record) themselves; only ADMIN lists everyone. */
@WebMvcTest(UserController.class)
@Import({ SecurityConfig.class, KeycloakRoleConverter.class })
class UserControllerSecurityTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @MockitoBean
    private UserService users;

    private static final UserView BUYER = new UserView("b1", "an.buyer", "an@example.com", "An", "Nguyen", true, true, "BUYER",
            List.of("BUYER"), Instant.EPOCH, Instant.EPOCH, Instant.EPOCH, null);

    @Test
    void anonymousIsNotRecorded() throws Exception {
        mvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
        verify(users, never()).sync(any());
    }

    @Test
    void signedInUserIsRecorded() throws Exception {
        when(users.sync(any())).thenReturn(BUYER);

        mvc.perform(get("/api/me").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_BUYER"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("an.buyer"));
        verify(users).sync(any());
    }

    @Test
    void otherRolesCannotListUsers() throws Exception {
        mvc.perform(get("/api/admin/users").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_BUYER"))))
                .andExpect(status().isForbidden());
        verify(users, never()).all();
    }

    @Test
    void adminCanListUsers() throws Exception {
        when(users.all()).thenReturn(List.of(BUYER));

        mvc.perform(get("/api/admin/users").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].accountType").value("BUYER"));
    }

    @Test
    void onlyAdminCanSyncFromKeycloak() throws Exception {
        mvc.perform(post("/api/admin/users/sync").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_COORDINATOR"))))
                .andExpect(status().isForbidden());
        verify(users, never()).syncFromKeycloak();

        when(users.syncFromKeycloak()).thenReturn(new SyncResult(1, Instant.EPOCH, List.of(BUYER)));
        mvc.perform(post("/api/admin/users/sync").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fromKeycloak").value(1));
    }
}
