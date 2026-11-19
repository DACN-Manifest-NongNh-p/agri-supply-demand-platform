// What the assistant "sees": the page's interactive elements as a short numbered list, instead of
// a screenshot. Each element gets a ref number (also written to data-agent-ref) that actions use.

export type SnapshotElement = {
  ref: number;
  kind: string;
  label: string;
  value?: string;
  disabled?: boolean;
  /** Option texts of a <select>, first few only. */
  options?: string[];
};

export type Snapshot = {
  url: string;
  title: string;
  elements: SnapshotElement[];
};

const INTERACTIVE = [
  "a[href]",
  "button",
  "input:not([type=hidden])",
  "select",
  "textarea",
  "summary",
  "[role=button]",
  "[role=link]",
  "[role=tab]",
  "[role=menuitem]",
  "[role=checkbox]",
  "[role=switch]",
  "[data-agent]",
].join(",");

/** The widget's own UI is never part of the page the assistant works on. */
const OWN_UI = ".cw-panel, .cw-bubble, .cw-cursor, .cw-highlight, .cw-badges";

const MAX_ELEMENTS = 200;
const MAX_LABEL = 60;

let refs = new Map<number, HTMLElement>();

export function elementForRef(ref: number): HTMLElement | null {
  const element = refs.get(ref);
  return element?.isConnected ? element : null;
}

function isVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  const style = getComputedStyle(element);
  return style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0;
}

function clip(text: string) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > MAX_LABEL ? `${flat.slice(0, MAX_LABEL - 1)}…` : flat;
}

// Same order a screen reader would use: explicit names first, visible text last.
function labelOf(element: HTMLElement) {
  const labelled = element.getAttribute("aria-labelledby");
  const fromLabelled = labelled
    ?.split(" ")
    .map((id) => document.getElementById(id)?.textContent ?? "")
    .join(" ");
  const fromLabels =
    element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement
      ? Array.from(element.labels ?? [])
          .map((label) => label.textContent ?? "")
          .join(" ")
      : "";
  return clip(
    element.getAttribute("aria-label") ||
      fromLabelled ||
      element.dataset.agent ||
      fromLabels ||
      element.getAttribute("placeholder") ||
      element.innerText ||
      element.getAttribute("title") ||
      element.getAttribute("name") ||
      "",
  );
}

function kindOf(element: HTMLElement) {
  const role = element.getAttribute("role");
  if (role) return role;
  const tag = element.tagName.toLowerCase();
  if (tag === "a") return "link";
  if (tag === "input") return `input:${(element as HTMLInputElement).type}`;
  return tag;
}

export function takeSnapshot(): Snapshot {
  document.querySelectorAll("[data-agent-ref]").forEach((element) => element.removeAttribute("data-agent-ref"));
  refs = new Map();

  const elements: SnapshotElement[] = [];
  for (const node of document.querySelectorAll<HTMLElement>(INTERACTIVE)) {
    if (elements.length >= MAX_ELEMENTS) break;
    if (node.closest(OWN_UI) || !isVisible(node)) continue;
    // A button inside a link (or similar) is one target, not two.
    if (node.parentElement?.closest(INTERACTIVE) && !node.matches("input, select, textarea")) continue;

    const ref = elements.length + 1;
    const item: SnapshotElement = { ref, kind: kindOf(node), label: labelOf(node) };
    if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
      if (node instanceof HTMLInputElement && (node.type === "checkbox" || node.type === "radio")) item.value = node.checked ? "checked" : "unchecked";
      else if (node.type !== "password" && node.value) item.value = clip(node.value);
    }
    if (node instanceof HTMLSelectElement) {
      item.value = clip(node.selectedOptions[0]?.text ?? "");
      item.options = Array.from(node.options)
        .slice(0, 12)
        .map((option) => clip(option.text));
    }
    if ((node as HTMLButtonElement).disabled || node.getAttribute("aria-disabled") === "true") item.disabled = true;

    node.setAttribute("data-agent-ref", String(ref));
    refs.set(ref, node);
    elements.push(item);
  }

  return { url: location.pathname + location.search, title: document.title, elements };
}

/** One line per element, e.g. `[12] button "New batch"` — the form sent to the model later. */
export function formatSnapshot(snapshot: Snapshot) {
  const lines = snapshot.elements.map((element) => {
    let line = `[${element.ref}] ${element.kind} "${element.label}"`;
    if (element.value) line += ` = "${element.value}"`;
    if (element.options) line += ` options: ${element.options.join(" | ")}`;
    if (element.disabled) line += " (disabled)";
    return line;
  });
  return [`Page: ${snapshot.url}`, ...lines].join("\n");
}

/** Finds an element by its visible name: exact match first, then the first that contains it. */
export function findByLabel(snapshot: Snapshot, text: string): SnapshotElement | undefined {
  const wanted = text.trim().toLowerCase();
  return (
    snapshot.elements.find((element) => element.label.toLowerCase() === wanted) ??
    snapshot.elements.find((element) => element.label.toLowerCase().includes(wanted))
  );
}
