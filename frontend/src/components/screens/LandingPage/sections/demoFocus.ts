/** Class for the element a demo step is about, so the eye goes straight to it. */
export const focus = (on: boolean, base = "") => (on ? `${base} dm-focus`.trim() : base);

/** One accent per demo, so the five videos are told apart at a glance. */
export const ACCENT = {
  overview: "#65a30d",
  verify: "#2563eb",
  matching: "#2f7d4a",
  procurement: "#d97706",
  auction: "#7c3aed",
  transaction: "#0d9488",
};
