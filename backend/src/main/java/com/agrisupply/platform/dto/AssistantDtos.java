package com.agrisupply.platform.dto;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request and response bodies for the assistant chat, and what the AI service sends back. */
public final class AssistantDtos {

    private AssistantDtos() {
    }

    /** An earlier message of the conversation, for context. */
    public record ChatTurn(@NotNull @Pattern(regexp = "user|assistant") String role,
                           @NotNull @Size(max = 4000) String text) {
    }

    public record ChatRequest(@NotBlank @Size(max = 2000) String message,
                              @Size(max = 20) List<@Valid ChatTurn> history) {
    }

    /** A policy passage the answer cites as [n]. */
    public record ChatSource(int n, String title, String headingPath, String text) {
    }

    public record ChatReply(String answer, List<ChatSource> sources) {
    }

    /** Body sent to the AI service; the role comes from the caller's token, never from the browser. */
    public record AiChatRequest(String message, List<ChatTurn> history, String role) {
    }

    public record AiSource(int n, String title, @JsonProperty("heading_path") String headingPath, String text) {
    }

    public record AiChatReply(String answer, List<AiSource> sources) {
    }

    /** What the browser reports back for one page action. */
    public record ActionResult(boolean ok, @Size(max = 500) String summary, @Size(max = 500) String error) {
    }

    /**
     * One round trip of an agent turn. A new turn sends {@code message}; a continuing one sends
     * {@code turnId} and the {@code results} of the actions it was given. {@code page} is the page snapshot.
     */
    public record StepRequest(@Size(max = 2000) String message,
                              @Size(max = 20) List<@Valid ChatTurn> history,
                              @Size(max = 64) String turnId,
                              @Size(max = 10) List<@Valid ActionResult> results,
                              @Size(max = 40000) String page) {
    }

    /** A page action for the browser to run: navigate, click, type, select or scroll. */
    public record PageAction(String name, Map<String, Object> args) {
    }

    /** {@code type} is "actions" (run them, then send the results) or "answer" (the turn is over). */
    public record StepReply(String type, String turnId, List<PageAction> actions, List<String> plan, String narration,
                            String answer, List<ChatSource> sources) {
    }

    public record AiStepRequest(String user, String role, String message, List<ChatTurn> history,
                                @JsonProperty("turn_id") String turnId, List<ActionResult> results, String page) {
    }

    public record AiStepReply(String type, @JsonProperty("turn_id") String turnId, List<PageAction> actions, List<String> plan,
                              String narration, String answer, List<AiSource> sources) {
    }
}
