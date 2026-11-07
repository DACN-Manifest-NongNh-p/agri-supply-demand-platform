// The assistant lives behind the Spring API (/api/assistant/*), which adds the caller's role from
// their token and forwards to the AI service. The browser never talks to the AI service itself.
import { apiJson } from "@/lib/api";
import type { ChatSource } from "./chatStore";

type Turn = { role: "user" | "assistant"; text: string };

export type AssistantReply = { answer: string; sources: ChatSource[] };

export function askAssistant(message: string, history: Turn[], signal?: AbortSignal) {
  return apiJson<AssistantReply>("api/assistant/chat", "POST", { message, history }, signal);
}

/** A page action the model wants run: navigate, click, type, select or scroll. */
export type PageAction = { name: string; args: Record<string, unknown> };
export type ActionResult = { ok: boolean; summary?: string; error?: string };

export type StepReply = {
  type: "actions" | "answer";
  turnId: string;
  actions: PageAction[];
  plan: string[];
  narration?: string;
  answer?: string;
  sources: ChatSource[];
};

type StepRequest =
  | { message: string; history: Turn[]; page: string }
  | { turnId: string; results: ActionResult[]; page: string };

/** One round trip of a turn that acts on the page (see agent/runner.ts). */
export function stepAssistant(body: StepRequest, signal?: AbortSignal) {
  return apiJson<StepReply>("api/assistant/step", "POST", body, signal);
}
