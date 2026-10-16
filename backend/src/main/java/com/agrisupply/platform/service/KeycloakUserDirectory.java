package com.agrisupply.platform.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

/**
 * Reads every user of the Farmora realm through the Keycloak Admin API, as the {@code farmora-api}
 * service account (client credentials, realm-management role {@code view-users} only). Read-only.
 */
@Component
public class KeycloakUserDirectory {

    private static final int PAGE = 100;

    /** A Keycloak user with what Farmora stores about them. */
    public record DirectoryUser(String id, String username, String email, String firstName, String lastName,
                                boolean emailVerified, boolean enabled, String accountType, List<String> realmRoles,
                                Instant createdAt) {
    }

    private final RestClient http;
    private final String serverUrl;
    private final String realm;
    private final String clientId;
    private final String clientSecret;

    public KeycloakUserDirectory(
            @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuerUri,
            @Value("${app.keycloak.sync.client-id}") String clientId,
            @Value("${app.keycloak.sync.client-secret}") String clientSecret) {
        // The issuer is <server>/realms/<realm>; the Admin API lives at <server>/admin/realms/<realm>.
        int at = issuerUri.indexOf("/realms/");
        this.serverUrl = issuerUri.substring(0, at);
        this.realm = issuerUri.substring(at + "/realms/".length()).replaceAll("/+$", "");
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.http = RestClient.create();
    }

    /** Every user in the realm (service accounts are not listed by Keycloak). */
    public List<DirectoryUser> allUsers() {
        if (clientSecret == null || clientSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Keycloak sync is not configured: set KEYCLOAK_SYNC_CLIENT_SECRET for the " + clientId + " client");
        }
        try {
            String token = serviceToken();
            List<DirectoryUser> users = new ArrayList<>();
            for (int first = 0; ; first += PAGE) {
                List<Map<String, Object>> page = get(token, "/users?briefRepresentation=false&first=" + first + "&max=" + PAGE);
                for (Map<String, Object> user : page) {
                    users.add(toUser(user, realmRoles(token, (String) user.get("id"))));
                }
                if (page.size() < PAGE) {
                    return users;
                }
            }
        } catch (RestClientException failure) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not read users from Keycloak: " + failure.getMessage(), failure);
        }
    }

    private String serviceToken() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        Map<String, Object> body = http.post()
                .uri(serverUrl + "/realms/" + realm + "/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(new ParameterizedTypeReference<Map<String, Object>>() { });
        return (String) body.get("access_token");
    }

    private List<String> realmRoles(String token, String userId) {
        return get(token, "/users/" + userId + "/role-mappings/realm").stream()
                .map(role -> (String) role.get("name"))
                .toList();
    }

    private List<Map<String, Object>> get(String token, String path) {
        List<Map<String, Object>> body = http.get()
                .uri(serverUrl + "/admin/realms/" + realm + path)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(new ParameterizedTypeReference<List<Map<String, Object>>>() { });
        return body == null ? List.of() : body;
    }

    private static DirectoryUser toUser(Map<String, Object> user, List<String> roles) {
        Object attributes = user.get("attributes");
        String accountType = null;
        if (attributes instanceof Map<?, ?> map && map.get("account_type") instanceof List<?> values && !values.isEmpty()) {
            accountType = String.valueOf(values.get(0));
        }
        Object created = user.get("createdTimestamp");
        return new DirectoryUser((String) user.get("id"), (String) user.get("username"), (String) user.get("email"),
                (String) user.get("firstName"), (String) user.get("lastName"),
                Boolean.TRUE.equals(user.get("emailVerified")), !Boolean.FALSE.equals(user.get("enabled")), accountType, roles,
                created instanceof Number millis ? Instant.ofEpochMilli(millis.longValue()) : null);
    }
}
