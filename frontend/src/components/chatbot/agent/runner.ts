// Runs one assistant turn that may act on the page. The model (behind the API) decides; this file
// carries out each page action with the on-screen pointer and reports back, until an answer comes.
//
//   message + page ──▶ actions ──▶ run them ──▶ results + new page ──▶ actions … ──▶ answer
import { stepAssistant, type ActionResult, type PageAction, type StepReply } from "../assistantApi";
import type { ChatSource } from "../chatStore";
import { runAction, type ActionContext, type AgentAction } from "./actions";
import { elementForRef, formatSnapshot, takeSnapshot } from "./snapshot";

export type TurnCallbacks = {
  /** A log line for the chat: what was just done. */
  onAction: (summary: string) => void;
  /** The plan, and which step (1-based) is being worked on; 0 before the first action. */
  onPlan: (steps: string[], current: number) => void;
  onNarration: (text: string) => void;
};

/**
 * Buttons whose effect matters (money, commitments, deletions) need the user's yes before the pointer
 * clicks them. Marked explicitly with data-agent-confirm, or recognised by the verb they start with.
 */
const CONSEQUENTIAL =
  /^(place|confirm|hold|reserve|pay|deposit|bid|buy|accept|approve|decline|reject|send|submit|save|publish|create|delete|remove|cancel|sign out|log out|đặt|xác nhận|giữ|thanh toán|mua|chấp nhận|duyệt|từ chối|gửi|lưu|tạo|đăng|xóa|xoá|hủy|huỷ|đăng xuất)\b/i;

function needsConfirmation(element: HTMLElement) {
  if (element.dataset.agentConfirm !== undefined) return element.dataset.agentConfirm || element.innerText.trim();
  if (!element.matches("button, [role=button], input[type=submit], input[type=button]")) return null;
  const label = (element.getAttribute("aria-label") || element.innerText || (element as HTMLInputElement).value || "").trim();
  return CONSEQUENTIAL.test(label) ? label : null;
}

function toAction(action: PageAction): AgentAction {
  const { args } = action;
  const ref = Number(args.ref);
  const caption = typeof args.caption === "string" ? args.caption : undefined;
  switch (action.name) {
    case "navigate":
      return { type: "navigate", path: String(args.path ?? ""), caption };
    case "click":
      return { type: "click", ref, caption };
    case "type":
      return { type: "type", ref, text: String(args.text ?? ""), caption };
    case "select":
      return { type: "select", ref, option: String(args.option ?? ""), caption };
    case "scroll": {
      const direction = String(args.direction);
      return { type: "scroll", direction: direction === "up" || direction === "top" || direction === "bottom" ? direction : "down" };
    }
    default:
      throw new Error(`Unknown action "${action.name}".`);
  }
}

async function runOne(action: PageAction, context: ActionContext, callbacks: TurnCallbacks): Promise<ActionResult> {
  try {
    const step = toAction(action);
    if (step.type === "click") {
      const element = elementForRef(step.ref);
      const label = element && needsConfirmation(element);
      // Temporary gate: a native dialog until the in-chat confirmation card (phase 5).
      if (label && !window.confirm(`Trợ lý muốn bấm “${label}”.\n${step.caption ?? ""}\n\nĐồng ý?`)) {
        callbacks.onAction(`Bạn đã từ chối bấm “${label}”.`);
        return { ok: false, error: "declined: the user did not allow this click" };
      }
    }
    const result = await runAction(step, context);
    callbacks.onAction(result.summary);
    return { ok: true, summary: result.summary };
  } catch (error) {
    if (context.signal.aborted) throw error;
    const message = error instanceof Error ? error.message : String(error);
    callbacks.onAction(`Không làm được: ${message}`);
    return { ok: false, error: message };
  }
}

export async function runAgentTurn(
  message: string,
  history: { role: "user" | "assistant"; text: string }[],
  context: ActionContext,
  callbacks: TurnCallbacks,
): Promise<{ answer: string; sources: ChatSource[] }> {
  let reply: StepReply = await stepAssistant({ message, history, page: formatSnapshot(takeSnapshot()) }, context.signal);

  while (reply.type === "actions") {
    if (reply.narration) callbacks.onNarration(reply.narration);
    const results: ActionResult[] = [];
    for (const action of reply.actions) {
      // After a failure the rest of the batch is skipped: it was planned for a page that did not come.
      if (results.some((result) => !result.ok)) {
        results.push({ ok: false, error: "skipped after an earlier failure" });
        continue;
      }
      const step = Number(action.args.step) || 0;
      callbacks.onPlan(reply.plan, step);
      results.push(await runOne(action, context, callbacks));
    }
    // runAction re-reads the page after each action; this snapshot is the page the model sees next.
    reply = await stepAssistant({ turnId: reply.turnId, results, page: formatSnapshot(takeSnapshot()) }, context.signal);
  }

  if (reply.plan.length) callbacks.onPlan(reply.plan, reply.plan.length + 1);
  return { answer: reply.answer ?? "", sources: reply.sources };
}
