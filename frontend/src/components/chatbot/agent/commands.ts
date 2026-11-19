// Typed commands for trying the page actions before the model is connected, e.g.
// `go /producer/batches; click New batch; type 3 Mango`. The model replaces this parser later;
// the actions underneath stay the same.
import { runAction, type ActionContext, type AgentAction } from "./actions";
import { elementForRef, findByLabel, formatSnapshot, takeSnapshot } from "./snapshot";
import { showBadges } from "./cursor";

export const HELP = [
  "Commands (separate several with ; or new lines):",
  "• read — list what's clickable, with numbers",
  "• click <number | text> — e.g. click 4, click Orders",
  "• type <number | \"text\"> <what to type> — e.g. type 3 Mango",
  "• select <number | \"text\"> <option>",
  "• go <path> — e.g. go /buyer/orders",
  "• scroll up | down | top | bottom",
].join("\n");

type Log = (role: "assistant" | "action", text: string) => void;

/** `4` → ref 4; `Orders` or `"Search products"` → the element with that name on the page now. */
function resolveRef(target: string) {
  const unquoted = target.replace(/^"(.*)"$/, "$1");
  if (/^\d+$/.test(unquoted)) {
    // Numbers come from the last "read"; if the page was never read, number it now.
    if (!elementForRef(Number(unquoted))) takeSnapshot();
    return Number(unquoted);
  }
  const match = findByLabel(takeSnapshot(), unquoted);
  if (!match) throw new Error(`Nothing called "${unquoted}" on this page. Try "read".`);
  return match.ref;
}

/** Splits `"Search products" mango` or `3 mango` into the target and the rest. */
function splitTarget(rest: string) {
  const quoted = rest.match(/^"([^"]+)"\s+(.+)$/);
  if (quoted) return [quoted[1], quoted[2]] as const;
  const plain = rest.match(/^(\S+)\s+(.+)$/);
  if (!plain) throw new Error("Say what to use and what to enter, e.g. type 3 Mango.");
  return [plain[1], plain[2]] as const;
}

function parse(line: string): AgentAction | "help" {
  const [, verb = "", rest = ""] = line.trim().match(/^(\S+)\s*(.*)$/) ?? [];
  switch (verb.toLowerCase()) {
    case "help":
      return "help";
    case "read":
      return { type: "read_page" };
    case "click":
      return { type: "click", ref: resolveRef(rest) };
    case "type": {
      const [targetText, text] = splitTarget(rest);
      return { type: "type", ref: resolveRef(targetText), text };
    }
    case "select": {
      const [targetText, option] = splitTarget(rest);
      return { type: "select", ref: resolveRef(targetText), option };
    }
    case "go":
      return { type: "navigate", path: rest.trim() };
    case "scroll": {
      const direction = rest.trim().toLowerCase();
      if (direction !== "up" && direction !== "down" && direction !== "top" && direction !== "bottom") {
        throw new Error("Scroll up, down, top or bottom.");
      }
      return { type: "scroll", direction };
    }
    default:
      throw new Error(`I don't know "${verb}" yet — the AI comes in a later phase. Type "help" for commands.`);
  }
}

export function looksLikeCommand(text: string) {
  return /^(help|read|click|type|select|go|scroll)\b/i.test(text.trim());
}

/** Runs each command in turn; stops at the first one that fails. */
export async function runCommands(input: string, context: ActionContext, log: Log) {
  const lines = input.split(/[;\n]/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    // Parsed one at a time: a later command's target may only exist after the earlier ones ran.
    const action = parse(line);
    if (action === "help") {
      log("assistant", HELP);
      continue;
    }
    const result = await runAction(action, context);
    log("action", result.summary);
    if (action.type === "read_page") {
      log("assistant", formatSnapshot(result.snapshot));
      showBadges(
        result.snapshot.elements.flatMap(({ ref }) => {
          const element = elementForRef(ref);
          return element ? [{ ref, element }] : [];
        }),
      );
    }
  }
}
