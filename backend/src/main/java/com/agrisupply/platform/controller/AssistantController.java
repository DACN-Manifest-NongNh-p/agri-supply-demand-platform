package com.agrisupply.platform.controller;

import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.agrisupply.platform.dto.AssistantDtos.ChatReply;
import com.agrisupply.platform.dto.AssistantDtos.ChatRequest;
import com.agrisupply.platform.dto.AssistantDtos.StepReply;
import com.agrisupply.platform.dto.AssistantDtos.StepRequest;
import com.agrisupply.platform.service.AssistantService;

import jakarta.validation.Valid;

@RestController
public class AssistantController {

    private final AssistantService assistant;

    public AssistantController(AssistantService assistant) {
        this.assistant = assistant;
    }

    /** One chat turn with the assistant, answered from the policies the caller's role may see. Signed-in users only. */
    @PostMapping("/api/assistant/chat")
    public ChatReply chat(JwtAuthenticationToken auth, @Valid @RequestBody ChatRequest request) {
        return assistant.chat(auth.getToken().getSubject(), auth.getAuthorities(), request);
    }

    /** One round trip of an assistant turn that acts on the page: page actions to run, or the answer. */
    @PostMapping("/api/assistant/step")
    public StepReply step(JwtAuthenticationToken auth, @Valid @RequestBody StepRequest request) {
        return assistant.step(auth.getToken().getSubject(), auth.getAuthorities(), request);
    }
}
