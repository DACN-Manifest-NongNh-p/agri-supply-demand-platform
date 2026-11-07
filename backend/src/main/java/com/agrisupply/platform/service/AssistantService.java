package com.agrisupply.platform.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Collection;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import com.agrisupply.platform.dto.AssistantDtos.AiChatReply;
import com.agrisupply.platform.dto.AssistantDtos.AiChatRequest;
import com.agrisupply.platform.dto.AssistantDtos.AiSource;
import com.agrisupply.platform.dto.AssistantDtos.AiStepReply;
import com.agrisupply.platform.dto.AssistantDtos.AiStepRequest;
import com.agrisupply.platform.dto.AssistantDtos.ChatReply;
import com.agrisupply.platform.dto.AssistantDtos.ChatRequest;
import com.agrisupply.platform.dto.AssistantDtos.ChatSource;
import com.agrisupply.platform.dto.AssistantDtos.StepReply;
import com.agrisupply.platform.dto.AssistantDtos.StepRequest;

/**
 * Forwards chat messages to the Python AI service (ai/), adding the caller's role so the assistant
 * only cites policies that role may see. Each user gets a small number of messages per minute,
 * since every message is a paid model call.
 */
@Service
public class AssistantService {

    /** Highest-privilege role first: a user with several roles is answered as the first one they have. */
    private static final List<String> ROLE_ORDER = List.of("ADMIN", "COORDINATOR", "LOGISTICS", "PRODUCER", "BUYER");
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final RestClient http;
    private final int perMinute;
    private final Map<String, Deque<Instant>> recent = new ConcurrentHashMap<>();

    public AssistantService(@Value("${app.assistant.url}") String url,
                            @Value("${app.assistant.messages-per-minute}") int perMinute) {
        var requests = new SimpleClientHttpRequestFactory();
        requests.setConnectTimeout(Duration.ofSeconds(3));
        // A turn may search several times and wait on the model; the AI service gives up at 60 s per call.
        requests.setReadTimeout(Duration.ofSeconds(120));
        this.http = RestClient.builder().baseUrl(url).requestFactory(requests).build();
        this.perMinute = perMinute;
    }

    public ChatReply chat(String user, Collection<? extends GrantedAuthority> authorities, ChatRequest request) {
        checkRate(user);
        var body = new AiChatRequest(request.message(), request.history() == null ? List.of() : request.history(), role(authorities));
        try {
            AiChatReply reply = http.post()
                    .uri("/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(AiChatReply.class);
            if (reply == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "The assistant sent an empty answer.");
            }
            return new ChatReply(reply.answer(), sources(reply.sources()));
        } catch (ResourceAccessException e) {
            throw unavailable(e);
        } catch (RestClientResponseException e) {
            throw failed(e);
        }
    }

    /**
     * One round trip of an agent turn that acts on the page. Only starting a turn counts against the
     * rate limit; the AI service caps the page actions within a turn, and only lets the same user continue it.
     */
    public StepReply step(String user, Collection<? extends GrantedAuthority> authorities, StepRequest request) {
        boolean starting = request.turnId() == null || request.turnId().isBlank();
        if (starting && (request.message() == null || request.message().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Send a message to start, or a turnId to continue.");
        }
        if (starting) {
            checkRate(user);
        }
        var body = new AiStepRequest(user, role(authorities), starting ? request.message() : null,
                request.history() == null ? List.of() : request.history(), starting ? null : request.turnId(),
                request.results() == null ? List.of() : request.results(), request.page() == null ? "" : request.page());
        try {
            AiStepReply reply = http.post()
                    .uri("/agent/step")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(AiStepReply.class);
            if (reply == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "The assistant sent an empty answer.");
            }
            return new StepReply(reply.type(), reply.turnId(), reply.actions() == null ? List.of() : reply.actions(),
                    reply.plan() == null ? List.of() : reply.plan(), reply.narration(), reply.answer(), sources(reply.sources()));
        } catch (ResourceAccessException e) {
            throw unavailable(e);
        } catch (RestClientResponseException e) {
            throw failed(e);
        }
    }

    private static List<ChatSource> sources(List<AiSource> sources) {
        return sources == null ? List.of()
                : sources.stream().map(s -> new ChatSource(s.n(), s.title(), s.headingPath(), s.text())).toList();
    }

    private static ResponseStatusException unavailable(Exception cause) {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "The assistant is not running right now.", cause);
    }

    private static ResponseStatusException failed(RestClientResponseException cause) {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                "The assistant could not answer (" + cause.getStatusCode().value() + ").", cause);
    }

    /** "ROLE_BUYER" → "buyer"; no app role → "public". */
    static String role(Collection<? extends GrantedAuthority> authorities) {
        var granted = authorities.stream().map(GrantedAuthority::getAuthority).toList();
        return ROLE_ORDER.stream()
                .filter(role -> granted.contains("ROLE_" + role))
                .findFirst()
                .map(String::toLowerCase)
                .orElse("public");
    }

    private void checkRate(String user) {
        Instant now = Instant.now();
        Deque<Instant> times = recent.computeIfAbsent(user, key -> new ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && times.peekFirst().isBefore(now.minus(WINDOW))) {
                times.pollFirst();
            }
            if (times.size() >= perMinute) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Too many messages; wait a minute before asking again.");
            }
            times.addLast(now);
        }
    }
}
