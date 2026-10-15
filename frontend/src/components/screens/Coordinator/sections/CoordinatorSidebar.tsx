import { GitCompareArrows, Inbox, LayoutGrid, Truck } from "lucide-react";
import { coordinator } from "../data/mockCoordinator";
import type { Theme } from "../data/theme";
import { AreaSidebar } from "./AreaSidebar";

export type SidebarCounts = { matching: number; requests: number; deliveries: number };

type Props = { counts: SidebarCounts; theme: Theme; onToggleTheme: () => void };

export function CoordinatorSidebar({ counts, theme, onToggleTheme }: Props) {
  return (
    <AreaSidebar
      home="/coordinator"
      roleLabel="Coordinator"
      fallbackName={coordinator.name}
      theme={theme}
      onToggleTheme={onToggleTheme}
      pages={[
        { label: "Overview", to: "/coordinator", end: true, icon: LayoutGrid },
        { label: "Matching", to: "/coordinator/matching", icon: GitCompareArrows, count: counts.matching },
        { label: "Requests", to: "/coordinator/requests", icon: Inbox, count: counts.requests },
        { label: "Deliveries", to: "/coordinator/deliveries", icon: Truck, count: counts.deliveries },
      ]}
    />
  );
}
