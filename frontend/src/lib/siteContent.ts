// Page text an admin can change in /admin/content. Each field has a key, where it shows, and the
// default text; the server only stores changed values, so clearing a field restores its default.
// A line break ("\n") in a title starts its second line.
import { useSite } from "@/lib/site";

export type ContentField = {
  key: string;
  group: string;
  label: string;
  defaultValue: string;
  multiline?: boolean;
  /** Shown under the field in the editor. */
  hint?: string;
  maxLength: number;
};

const TITLE_HINT = "Press Enter to start the second line.";

export const CONTENT_FIELDS: ContentField[] = [
  { group: "Hero", key: "landing.hero.eyebrow", label: "Small heading", defaultValue: "Connecting Supply, Demand & Time", maxLength: 60 },
  { group: "Hero", key: "landing.hero.title", label: "Title", defaultValue: "Freshness Has a Deadline\nAct in Time.", multiline: true, hint: TITLE_HINT, maxLength: 90 },
  {
    group: "Hero",
    key: "landing.hero.description",
    label: "Description",
    defaultValue:
      "Connect agricultural supply with real demand while tracking harvest time, shelf life, location, and transportation — helping the right produce reach the right destination before it becomes waste.",
    multiline: true,
    maxLength: 320,
  },
  { group: "Hero", key: "landing.hero.primaryCta", label: "Main button", defaultValue: "Explore the Platform", maxLength: 30 },
  { group: "Hero", key: "landing.hero.secondaryCta", label: "Second button", defaultValue: "How It Works", maxLength: 30 },
  { group: "Hero", key: "landing.hero.asideTitle", label: "Side note title", defaultValue: "Why Timing Matters", maxLength: 40 },
  {
    group: "Hero",
    key: "landing.hero.asideText",
    label: "Side note text",
    defaultValue: "Fresh produce has a limited window of value. Farmora considers freshness, demand, distance, and transportation to help move each batch where it matters most.",
    multiline: true,
    maxLength: 220,
  },
  {
    group: "Sections",
    key: "landing.intro.heading",
    label: "Introduction heading",
    defaultValue: "The challenge isn’t just finding supply.\nIt's finding the right demand in time.",
    multiline: true,
    hint: TITLE_HINT,
    maxLength: 120,
  },
  { group: "Sections", key: "landing.howItWorks.title", label: "How it works title", defaultValue: "From harvest to destination,\nevery decision is connected.", multiline: true, hint: TITLE_HINT, maxLength: 100 },
  { group: "Sections", key: "landing.timeAware.title", label: "Time-aware title", defaultValue: "Freshness changes\nthe priority.", multiline: true, hint: TITLE_HINT, maxLength: 80 },
  {
    group: "Sections",
    key: "landing.timeAware.intro",
    label: "Time-aware text",
    defaultValue:
      "The same product and quantity can have very different urgency. Farmora considers harvest date, remaining shelf life and transportation time to determine which batches need attention first.",
    multiline: true,
    maxLength: 320,
  },
  { group: "Sections", key: "landing.intelligence.title", label: "Intelligence title", defaultValue: "See the imbalance before it becomes waste.", maxLength: 80 },
  {
    group: "Sections",
    key: "landing.intelligence.intro",
    label: "Intelligence text",
    defaultValue: "Farmora uses historical supply, demand, seasonal, and transaction data to provide forecasts and risk signals that support coordination decisions.",
    multiline: true,
    maxLength: 320,
  },
  { group: "Sections", key: "landing.smart.title", label: "Smart coordination title", defaultValue: "Find where the produce should go next.", maxLength: 80 },
  {
    group: "Sections",
    key: "landing.smart.intro",
    label: "Smart coordination text",
    defaultValue:
      "When multiple supply batches can satisfy the same demand, the system can consider remaining shelf life, distance, transportation time, quality, and demand to prioritize suitable coordination options.",
    multiline: true,
    maxLength: 320,
  },
  { group: "Sections", key: "landing.reservation.title", label: "Reservation title", defaultValue: "One batch. One reliable inventory.", maxLength: 80 },
  {
    group: "Sections",
    key: "landing.reservation.intro",
    label: "Reservation text",
    defaultValue: "When a buyer places an order, the requested quantity is temporarily reserved so multiple buyers cannot claim the same available supply.",
    multiline: true,
    maxLength: 320,
  },
  { group: "Sections", key: "landing.rescue.title", label: "Rescue title", defaultValue: "Rescue before it becomes waste.", maxLength: 80 },
  {
    group: "Sections",
    key: "landing.rescue.intro",
    label: "Rescue text",
    defaultValue: "When a batch is predicted to have a high risk of remaining unsold or spoiling, the system can prioritize it for alternative demand, redistribution, or rescue.",
    multiline: true,
    maxLength: 320,
  },
  { group: "Call to action", key: "landing.cta.title", label: "Title", defaultValue: "Turn agricultural data into timely action.", maxLength: 80 },
  { group: "Call to action", key: "landing.cta.intro", label: "Text", defaultValue: "Connect supply, demand, time, and transportation in one coordination platform.", multiline: true, maxLength: 200 },
  { group: "Call to action", key: "landing.cta.primary", label: "Main button", defaultValue: "Get Started", maxLength: 30 },
  { group: "Call to action", key: "landing.cta.secondary", label: "Second button", defaultValue: "Explore the Platform", maxLength: 30 },
];

const DEFAULTS = new Map(CONTENT_FIELDS.map((field) => [field.key, field.defaultValue]));

export function contentDefault(key: string) {
  return DEFAULTS.get(key) ?? "";
}

/** Text for a content key: the admin's version if there is one, else the default. */
export function useContent() {
  const { content } = useSite();
  return (key: string) => content[key] ?? contentDefault(key);
}
