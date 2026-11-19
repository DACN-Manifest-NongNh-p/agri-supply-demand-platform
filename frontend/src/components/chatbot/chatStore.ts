// Chat history for the assistant widget. Kept in this tab (sessionStorage) so a reload or a route
// change does not lose the conversation; a new tab starts fresh.

/** A policy passage an answer cites as [n]. */
export type ChatSource = { n: number; title: string; headingPath: string; text: string };

export type ChatMessage = {
  id: string;
  /**
   * "action" is a log line (something done on the page, or a status/error note); "plan" is the
   * assistant's step list for a task. Neither is sent back as history.
   */
  role: "user" | "assistant" | "action" | "plan";
  text: string;
  sources?: ChatSource[];
  /** For "plan": the steps, and the one being worked on (1-based; past the end when finished). */
  plan?: { steps: string[]; current: number };
};

const STORAGE_KEY = "agri.chat.messages";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Xin chào! Hỏi mình về quy định của Farmora: giữ hàng, đặt cọc, hủy đơn, đấu giá, giao nhận, chất lượng… Gõ \"help\" để xem các lệnh điều khiển trang.",
};

export function newMessage(role: ChatMessage["role"], text: string, sources?: ChatSource[]): ChatMessage {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, role, text, ...(sources?.length ? { sources } : {}) };
}

// Storage can be blocked (private mode, disabled site data); the chat still works, just unsaved.
export function loadMessages(): ChatMessage[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (Array.isArray(saved) && saved.length > 0) return saved;
  } catch {
    // fall through to a fresh conversation
  }
  return [WELCOME];
}

export function saveMessages(messages: ChatMessage[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // not saved; nothing else to do
  }
}

export function resetMessages(): ChatMessage[] {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return [WELCOME];
}

/** Questions offered under the conversation, by the area the user is in. */
const SUGGESTIONS: Record<string, string[]> = {
  producer: ["Làm sao mở phiên đấu giá khi quả còn trên cây?", "Điểm uy tín thấp bị hạn chế gì?"],
  buyer: ["Hủy đơn đặt trước có mất cọc không?", "Hàng bị dập bao nhiêu thì được từ chối nhận?"],
  coordinator: ["Khi nào việc giữ hàng cần tôi duyệt?", "Có những phương án giải cứu nào?"],
  logistics: ["Xe lạnh phải giữ nhiệt độ bao nhiêu?", "Giao trễ làm hỏng hàng thì ai chịu?"],
  admin: ["Các vai trò trên Farmora được làm gì?", "Điểm uy tín được tính thế nào?"],
};

export function suggestionsFor(pathname: string): string[] {
  const area = pathname.split("/")[1] ?? "";
  return SUGGESTIONS[area] ?? ["Farmora là gì?", "Vị trí trang trại có bị lộ không?"];
}

/** The conversation as the assistant API expects it: questions and answers only, newest last. */
export function historyFor(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.id !== "welcome" && (message.role === "user" || message.role === "assistant"))
    .slice(-10)
    .map((message) => ({ role: message.role as "user" | "assistant", text: message.text }));
}
