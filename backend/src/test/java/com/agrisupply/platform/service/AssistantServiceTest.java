package com.agrisupply.platform.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.server.ResponseStatusException;

import com.agrisupply.platform.dto.AssistantDtos.ChatRequest;
import com.agrisupply.platform.dto.AssistantDtos.StepRequest;

class AssistantServiceTest {

    @Test
    void roleIsTheHighestAppRoleOrPublic() {
        assertThat(AssistantService.role(List.of(new SimpleGrantedAuthority("ROLE_BUYER")))).isEqualTo("buyer");
        assertThat(AssistantService.role(List.of(new SimpleGrantedAuthority("ROLE_BUYER"), new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .isEqualTo("admin");
        assertThat(AssistantService.role(List.of(new SimpleGrantedAuthority("SCOPE_profile")))).isEqualTo("public");
    }

    @Test
    void unreachableServiceIsReportedAndMessagesAreRateLimited() {
        // Port 1 refuses connections at once, so the first message fails fast with 503.
        var service = new AssistantService("http://localhost:1", 1);
        var buyer = List.of(new SimpleGrantedAuthority("ROLE_BUYER"));
        var request = new ChatRequest("Xin chào", List.of());

        assertThatThrownBy(() -> service.chat("u-1", buyer, request))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
        assertThatThrownBy(() -> service.chat("u-1", buyer, request))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS));
        // Limits are per user.
        assertThatThrownBy(() -> service.chat("u-2", buyer, request))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
    }

    @Test
    void stepNeedsAMessageOrATurnAndOnlyNewTurnsAreRateLimited() {
        var service = new AssistantService("http://localhost:1", 1);
        var buyer = List.of(new SimpleGrantedAuthority("ROLE_BUYER"));

        assertThatThrownBy(() -> service.step("u-1", buyer, new StepRequest(null, null, null, null, "")))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        // Starting uses the one message allowed this minute…
        assertThatThrownBy(() -> service.step("u-1", buyer, new StepRequest("mở đơn hàng", List.of(), null, null, "")))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
        // …but continuing the turn is not counted.
        assertThatThrownBy(() -> service.step("u-1", buyer, new StepRequest(null, null, "t-1", List.of(), "")))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
    }
}
