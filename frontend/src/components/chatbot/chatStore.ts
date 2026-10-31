// Chat history for the assistant widget. Kept in this tab (sessionStorage) so a reload or a route
// change does not lose the conversation; a new tab starts fresh.

export type ChatMessage = {
  id: string;
  /** "action" is a log line for something the assistant did on the page (click, type, navigate). */
  role: "user" | "assistant" | "action";
  text: string;
};

const STORAGE_KEY = "agri.chat.messages";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  // Until the AI is connected the assistant takes typed commands (see agent/commands.ts).
  text: "Hi! I can work the page for you. For now I take commands — try \"read\", then \"click <number>\". Type \"help\" for the list.",
};

export function newMessage(role: ChatMessage["role"], text: string): ChatMessage {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, role, text };
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

/** Quick commands offered under the conversation, by the area the user is in. */
const SUGGESTIONS: Record<string, string[]> = {
  producer: ["go /producer/batches", "go /producer/orders"],
  buyer: ["go /buyer/supply", "go /buyer/orders"],
  coordinator: ["go /coordinator/matching", "go /coordinator/deliveries"],
  logistics: ["go /logistics/trips", "go /logistics/orders"],
  admin: ["go /admin/users", "go /admin/products"],
};

export function suggestionsFor(pathname: string): string[] {
  const area = pathname.split("/")[1] ?? "";
  return ["help", "read", "scroll down", ...(SUGGESTIONS[area] ?? [])];
}
