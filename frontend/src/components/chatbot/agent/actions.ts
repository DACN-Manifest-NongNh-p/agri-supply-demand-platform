// Carries out one page action: scroll the target into view, glide the pointer there, then click,
// type or pick an option the way a person would, and wait for the page to settle.
// These are the "tools" the model will call in a later phase.
import { elementForRef, takeSnapshot, type Snapshot } from "./snapshot";
import { announce, hideCaption, moveTo, pulse, showCursor, sleep } from "./cursor";

/** `caption` is what the bubble says before the action; without one a plain description is shown. */
export type AgentAction =
  | { type: "navigate"; path: string; caption?: string }
  | { type: "click"; ref: number; caption?: string }
  | { type: "type"; ref: number; text: string; caption?: string }
  | { type: "select"; ref: number; option: string; caption?: string }
  | { type: "scroll"; direction: "up" | "down" | "top" | "bottom" }
  | { type: "read_page" };

/** How long the caption shows before the pointer acts. */
export const CAPTION_MS = 1000;

export type ActionContext = {
  navigate: (path: string) => void;
  signal: AbortSignal;
  /** Overrides CAPTION_MS (e.g. a faster speed setting); 0 acts at once. */
  captionMs?: number;
};

export type ActionResult = {
  /** One line for the chat log, e.g. `Clicked [4] link "Orders"`. */
  summary: string;
  /** The page after the action, for the next decision. */
  snapshot: Snapshot;
};

function target(ref: number) {
  const element = elementForRef(ref);
  if (!element) throw new Error(`Element [${ref}] is no longer on the page. Read the page again.`);
  return element;
}

function nameOf(element: HTMLElement) {
  return (element.getAttribute("aria-label") || element.innerText || element.getAttribute("placeholder") || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

function describe(ref: number, element: HTMLElement) {
  return `[${ref}] "${nameOf(element)}"`;
}

const OWN_UI = ".cw-panel, .cw-bubble, .cw-cursor, .cw-highlight, .cw-badges, .cw-caption";

/**
 * A visible link on the page that goes to `path`, so navigating looks like a person clicking the menu.
 * Exact match (path and query) first, then the same page with another query.
 */
function linkTo(path: string): HTMLAnchorElement | null {
  const wanted = new URL(path, location.origin);
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]")).filter((link) => {
    if (link.closest(OWN_UI)) return false;
    const rect = link.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && link.origin === location.origin;
  });
  return (
    links.find((link) => link.pathname === wanted.pathname && link.search === wanted.search) ??
    links.find((link) => link.pathname === wanted.pathname) ??
    null
  );
}

async function bringIntoView(element: HTMLElement, signal: AbortSignal) {
  const rect = element.getBoundingClientRect();
  if (rect.top >= 0 && rect.bottom <= window.innerHeight) return;
  element.scrollIntoView({ block: "center", behavior: "smooth" });
  await sleep(450, signal);
}

/** Resolves once the page has stopped changing for a moment (data loaded, route rendered). */
function waitForSettle(signal: AbortSignal, quietMs = 300, maxMs = 2500) {
  return new Promise<void>((resolve, reject) => {
    let quietTimer = window.setTimeout(done, quietMs);
    const maxTimer = window.setTimeout(done, maxMs);
    const observer = new MutationObserver((mutations) => {
      // The pointer and the chat panel change all the time; only the page itself counts.
      const pageChanged = mutations.some((mutation) => {
        const node = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
        return !node?.closest(".cw-panel, .cw-cursor, .cw-highlight, .cw-badges");
      });
      if (!pageChanged) return;
      window.clearTimeout(quietTimer);
      quietTimer = window.setTimeout(done, quietMs);
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
    signal.addEventListener("abort", () => finish(() => reject(new DOMException("Stopped", "AbortError"))), { once: true });

    function finish(then: () => void) {
      observer.disconnect();
      window.clearTimeout(quietTimer);
      window.clearTimeout(maxTimer);
      then();
    }
    function done() {
      finish(resolve);
    }
  });
}

// React keeps its own copy of an input's value; setting .value directly is ignored on the next
// render. Going through the native setter and firing "input" makes onChange see the new text.
function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const prototype = Object.getPrototypeOf(element) as object;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  if (setter) setter.call(element, value);
  else element.value = value;
}

function clickLike(element: HTMLElement) {
  const options = { bubbles: true, cancelable: true, view: window };
  element.dispatchEvent(new PointerEvent("pointerdown", options));
  element.dispatchEvent(new MouseEvent("mousedown", options));
  element.focus({ preventScroll: true });
  element.dispatchEvent(new PointerEvent("pointerup", options));
  element.dispatchEvent(new MouseEvent("mouseup", options));
  element.click();
}

async function typeInto(element: HTMLElement, text: string, signal: AbortSignal) {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    throw new Error("That element is not a text field.");
  }
  element.focus({ preventScroll: true });
  setNativeValue(element, "");
  element.dispatchEvent(new Event("input", { bubbles: true }));
  // Typed letter by letter so it can be watched, but never longer than about a second.
  const delay = Math.min(45, 1000 / Math.max(text.length, 1));
  for (let index = 1; index <= text.length; index++) {
    setNativeValue(element, text.slice(0, index));
    element.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(delay, signal);
  }
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function selectOption(element: HTMLElement, option: string) {
  if (!(element instanceof HTMLSelectElement)) throw new Error("That element is not a dropdown.");
  const wanted = option.trim().toLowerCase();
  const match =
    Array.from(element.options).find((item) => item.text.trim().toLowerCase() === wanted || item.value.toLowerCase() === wanted) ??
    Array.from(element.options).find((item) => item.text.toLowerCase().includes(wanted));
  if (!match) throw new Error(`No option "${option}" in that dropdown.`);
  setNativeValue(element, match.value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  return match.text;
}

export async function runAction(action: AgentAction, { navigate, signal, captionMs = CAPTION_MS }: ActionContext): Promise<ActionResult> {
  let summary: string;
  // Pointer at the target, then the caption runs down, then the action happens.
  const approach = async (element: HTMLElement, fallback: string, caption?: string) => {
    await bringIntoView(element, signal);
    await moveTo(element, signal);
    if (captionMs > 0) await announce(caption || fallback, captionMs, signal);
    pulse();
  };

  try {
    switch (action.type) {
      case "navigate": {
        // Same-app paths only.
        if (!action.path.startsWith("/") || action.path.startsWith("//")) throw new Error(`"${action.path}" is not a page of this site.`);
        const link = linkTo(action.path);
        if (link) {
          // The pointer goes to the menu link and clicks it, like a person would.
          await approach(link, `Mở “${nameOf(link) || action.path}”`, action.caption);
          await sleep(120, signal);
          clickLike(link);
          await sleep(150, signal);
        } else if (captionMs > 0) {
          // No link to this page on screen: say where we are going, then go.
          showCursor();
          await announce(action.caption || `Chuyển tới trang ${action.path}`, captionMs, signal);
        }
        // The link may only lead nearby (another tab, a redirect); make sure we end up on the page asked for.
        const wanted = new URL(action.path, location.origin);
        if (location.pathname + location.search !== wanted.pathname + wanted.search) {
          navigate(action.path);
        }
        summary = link ? `Opened “${nameOf(link)}” (${action.path})` : `Went to ${action.path}`;
        break;
      }
      case "click": {
        const element = target(action.ref);
        if ((element as HTMLButtonElement).disabled) throw new Error(`${describe(action.ref, element)} is disabled.`);
        await approach(element, `Nhấp vào “${nameOf(element)}”`, action.caption);
        await sleep(120, signal);
        clickLike(element);
        summary = `Clicked ${describe(action.ref, element)}`;
        break;
      }
      case "type": {
        const element = target(action.ref);
        await approach(element, `Gõ “${action.text}” vào “${nameOf(element)}”`, action.caption);
        await typeInto(element, action.text, signal);
        summary = `Typed "${action.text}" into ${describe(action.ref, element)}`;
        break;
      }
      case "select": {
        const element = target(action.ref);
        await approach(element, `Chọn “${action.option}” trong “${nameOf(element)}”`, action.caption);
        const chosen = selectOption(element, action.option);
        summary = `Picked "${chosen}" in [${action.ref}]`;
        break;
      }
      case "scroll": {
        const step = window.innerHeight * 0.8;
        const top = { up: window.scrollY - step, down: window.scrollY + step, top: 0, bottom: document.body.scrollHeight }[action.direction];
        window.scrollTo({ top, behavior: "smooth" });
        await sleep(450, signal);
        summary = `Scrolled ${action.direction}`;
        break;
      }
      case "read_page":
        summary = "Read the page";
        break;
    }
  } finally {
    hideCaption();
  }

  await waitForSettle(signal);
  return { summary, snapshot: takeSnapshot() };
}
