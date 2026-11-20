// A small coloured fruit badge, so lists read at a glance instead of as text.
import { Apple, Banana, Cherry, Citrus, Grape, Sprout, type LucideIcon } from "lucide-react";

const LOOK: Record<string, { icon: LucideIcon; tone: string }> = {
  "Dragon fruit": { icon: Sprout, tone: "pink" },
  Mango: { icon: Apple, tone: "amber" },
  Pomelo: { icon: Citrus, tone: "lime" },
  Avocado: { icon: Apple, tone: "green" },
  Durian: { icon: Sprout, tone: "olive" },
  Rambutan: { icon: Cherry, tone: "red" },
  Longan: { icon: Grape, tone: "sand" },
  Lychee: { icon: Cherry, tone: "red" },
  Mangosteen: { icon: Grape, tone: "purple" },
  Banana: { icon: Banana, tone: "amber" },
  Pineapple: { icon: Citrus, tone: "amber" },
};

export function ProductIcon({ crop, size = 40 }: { crop: string; size?: number }) {
  const look = LOOK[crop] ?? { icon: Apple, tone: "green" };
  const Icon = look.icon;
  return (
    <span className={`pi pi--${look.tone}`} style={{ width: size, height: size }} aria-hidden="true">
      <Icon size={Math.round(size * 0.5)} />
    </span>
  );
}
