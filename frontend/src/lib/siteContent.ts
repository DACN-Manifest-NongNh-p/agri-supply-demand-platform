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
  { group: "Hero", key: "landing.hero.eyebrow", label: "Small heading", defaultValue: "Online market for fresh produce", maxLength: 60 },
  { group: "Hero", key: "landing.hero.title", label: "Title", defaultValue: "Farms sell. Businesses buy.\nFarmora connects them.", multiline: true, hint: TITLE_HINT, maxLength: 90 },
  {
    group: "Hero",
    key: "landing.hero.description",
    label: "Description",
    defaultValue:
      "Farms and cooperatives list the produce they harvested. Supermarkets, wholesalers and processors buy it at a fair market price. Both sides confirm, and Farmora follows the deal until the goods arrive.",
    multiline: true,
    maxLength: 320,
  },
  { group: "Hero", key: "landing.hero.primaryCta", label: "Main button", defaultValue: "See it in 30 seconds", maxLength: 30 },
  { group: "Hero", key: "landing.hero.secondaryCta", label: "Second button", defaultValue: "How it works", maxLength: 30 },
  { group: "Hero", key: "landing.hero.asideTitle", label: "Side note title", defaultValue: "Who uses Farmora", maxLength: 40 },
  {
    group: "Hero",
    key: "landing.hero.asideText",
    label: "Side note text",
    defaultValue: "Sellers: farms, cooperatives, producers. Buyers: supermarkets, wholesalers, processors and exporters. Every account is a verified business.",
    multiline: true,
    maxLength: 220,
  },
  { group: "Sections", key: "landing.howItWorks.title", label: "How it works title", defaultValue: "From verified parties to delivered goods,\none connected flow.", multiline: true, hint: TITLE_HINT, maxLength: 100 },
  { group: "Call to action", key: "landing.cta.title", label: "Title", defaultValue: "Start trading with verified partners.", maxLength: 80 },
  { group: "Call to action", key: "landing.cta.intro", label: "Text", defaultValue: "Register, verify your business, and trade through the channel that fits each deal.", multiline: true, maxLength: 200 },
  { group: "Call to action", key: "landing.cta.primary", label: "Main button", defaultValue: "Get Started", maxLength: 30 },
  { group: "Call to action", key: "landing.cta.secondary", label: "Second button", defaultValue: "See the channels", maxLength: 30 },
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
