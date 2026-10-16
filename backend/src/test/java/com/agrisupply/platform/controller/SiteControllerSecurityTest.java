package com.agrisupply.platform.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.agrisupply.platform.config.KeycloakRoleConverter;
import com.agrisupply.platform.config.SecurityConfig;
import com.agrisupply.platform.service.AnnouncementService;
import com.agrisupply.platform.service.PlatformRuleService;
import com.agrisupply.platform.service.ProductService;
import com.agrisupply.platform.service.SiteContentService;

/** Everyone reads the site configuration; only ADMIN changes it. */
@WebMvcTest({ PublicSiteController.class, AdminSiteController.class })
@Import({ SecurityConfig.class, KeycloakRoleConverter.class })
class SiteControllerSecurityTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @MockitoBean
    private SiteContentService content;

    @MockitoBean
    private PlatformRuleService rules;

    @MockitoBean
    private ProductService products;

    @MockitoBean
    private AnnouncementService announcements;

    private static final String RULES_BODY = "{\"values\":{\"holdHours\":12}}";

    @Test
    void anyoneCanReadTheSite() throws Exception {
        when(content.overrides()).thenReturn(Map.of());
        when(content.lastUpdated()).thenReturn(Optional.empty());
        when(rules.rules()).thenReturn(List.of());
        when(products.all()).thenReturn(List.of());
        when(announcements.live()).thenReturn(List.of());

        mvc.perform(get("/api/public/site")).andExpect(status().isOk());
    }

    @Test
    void anonymousCannotChangeRules() throws Exception {
        mvc.perform(put("/api/admin/rules").contentType(MediaType.APPLICATION_JSON).content(RULES_BODY))
                .andExpect(status().isUnauthorized());
        verify(rules, never()).update(anyMap(), any());
    }

    @Test
    void otherRolesCannotChangeRules() throws Exception {
        mvc.perform(put("/api/admin/rules").contentType(MediaType.APPLICATION_JSON).content(RULES_BODY)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_COORDINATOR"))))
                .andExpect(status().isForbidden());
        verify(rules, never()).update(anyMap(), any());
    }

    @Test
    void adminCanChangeRules() throws Exception {
        when(rules.update(anyMap(), any())).thenReturn(List.of());

        mvc.perform(put("/api/admin/rules").contentType(MediaType.APPLICATION_JSON).content(RULES_BODY)
                        .with(jwt().jwt(token -> token.subject("farmora.admin"))
                                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk());
        verify(rules).update(anyMap(), eq("farmora.admin"));
    }
}
