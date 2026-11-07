// The on-screen pointer the assistant "moves". A browser page cannot drive the real mouse, so this
// draws one over the page, glides it to the target and outlines what it is about to use.

const POINTER_SVG =
  '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.04 2.5a.75.75 0 0 0-1.02.95l6.3 17.6a.75.75 0 0 0 1.4.03l2.62-6.37 6.37-2.62a.75.75 0 0 0-.03-1.4z" fill="#2f6340" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';

let cursor: HTMLDivElement | null = null;
let highlight: HTMLDivElement | null = null;
let caption: HTMLDivElement | null = null;
let badges: HTMLDivElement | null = null;
let badgeTimer = 0;
let position = { x: 0, y: 0 };

export function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Stopped", "AbortError"));
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Stopped", "AbortError"));
      },
      { once: true },
    );
  });
}

function ensureCursor() {
  if (cursor?.isConnected) return cursor;
  cursor = document.createElement("div");
  cursor.className = "cw-cursor";
  cursor.innerHTML = POINTER_SVG;
  // Enters from the left edge of the chat panel, roughly where the user's eyes already are.
  const panel = document.querySelector(".cw-panel")?.getBoundingClientRect();
  position = { x: panel ? panel.left - 40 : window.innerWidth - 80, y: window.innerHeight * 0.6 };
  cursor.style.transform = `translate(${position.x}px, ${position.y}px)`;
  document.body.appendChild(cursor);
  return cursor;
}

/** Glides the pointer to the middle of the element; the farther it goes, the longer it takes. */
export async function moveTo(element: HTMLElement, signal?: AbortSignal) {
  const node = ensureCursor();
  node.classList.add("is-visible");
  const rect = element.getBoundingClientRect();
  const target = { x: rect.left + Math.min(rect.width / 2, 40), y: rect.top + rect.height / 2 };
  const distance = Math.hypot(target.x - position.x, target.y - position.y);
  const duration = Math.round(Math.min(700, Math.max(250, distance * 0.8)));
  node.style.transitionDuration = `${duration}ms`;
  node.style.transform = `translate(${target.x}px, ${target.y}px)`;
  position = target;
  showHighlight(element);
  await sleep(duration, signal);
}

/** Shows the pointer where it is, for steps with nothing on the page to point at. */
export function showCursor() {
  ensureCursor().classList.add("is-visible");
}

/** Small ring under the pointer, so a click can be seen. */
export function pulse() {
  const node = ensureCursor();
  node.classList.remove("is-clicking");
  void node.offsetWidth; // restart the animation
  node.classList.add("is-clicking");
}

export function showHighlight(element: HTMLElement) {
  if (!highlight?.isConnected) {
    highlight = document.createElement("div");
    highlight.className = "cw-highlight";
    document.body.appendChild(highlight);
  }
  const rect = element.getBoundingClientRect();
  Object.assign(highlight.style, {
    top: `${rect.top - 4}px`,
    left: `${rect.left - 4}px`,
    width: `${rect.width + 8}px`,
    height: `${rect.height + 8}px`,
  });
  highlight.classList.add("is-visible");
}

/** Numbered tags over the elements on screen, so a person testing commands can see the refs. */
export function showBadges(items: { ref: number; element: HTMLElement }[], ms = 5000) {
  hideBadges();
  badges = document.createElement("div");
  badges.className = "cw-badges";
  for (const { ref, element } of items) {
    const rect = element.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
    const badge = document.createElement("span");
    badge.textContent = String(ref);
    badge.style.top = `${Math.max(0, rect.top - 8)}px`;
    badge.style.left = `${Math.max(0, rect.left - 8)}px`;
    badges.appendChild(badge);
  }
  document.body.appendChild(badges);
  badgeTimer = window.setTimeout(hideBadges, ms);
}

export function hideBadges() {
  window.clearTimeout(badgeTimer);
  badges?.remove();
  badges = null;
}

/**
 * Says what is about to happen in a bubble next to the pointer, with a bar that runs out over `ms`,
 * then resolves so the action can go ahead. The person watching always knows the next click first.
 */
export async function announce(text: string, ms: number, signal?: AbortSignal) {
  if (!caption?.isConnected) {
    caption = document.createElement("div");
    caption.className = "cw-caption";
    caption.setAttribute("role", "status");
    caption.innerHTML = '<span class="cw-caption-text"></span><span class="cw-caption-bar"></span>';
    document.body.appendChild(caption);
  }
  caption.querySelector(".cw-caption-text")!.textContent = text;
  const bar = caption.querySelector<HTMLSpanElement>(".cw-caption-bar")!;
  bar.style.animation = "none";
  void bar.offsetWidth; // restart the countdown
  bar.style.animation = `cw-caption-countdown ${ms}ms linear forwards`;

  // Below-right of the pointer, kept inside the viewport.
  const width = Math.min(280, window.innerWidth - 24);
  caption.style.maxWidth = `${width}px`;
  caption.style.left = `${Math.max(12, Math.min(position.x + 18, window.innerWidth - width - 12))}px`;
  caption.style.top = `${Math.max(12, Math.min(position.y + 26, window.innerHeight - 80))}px`;
  caption.classList.add("is-visible");
  await sleep(ms, signal);
}

export function hideCaption() {
  caption?.classList.remove("is-visible");
}

/** Fades everything out once a run is over. */
export function hideCursor() {
  cursor?.classList.remove("is-visible");
  highlight?.classList.remove("is-visible");
  hideCaption();
}
