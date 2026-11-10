import type { MouseEvent, ReactNode } from "react";
import type { PartyRole } from "@/lib/parties";
import { usePartyParam } from "./usePartyParam";
import "@/components/offers/offers.css";

/** A buyer or producer name that opens their card: profile, history together, open demand, contact. */
export function PartyLink({ name, role, children, className }: { name: string; role: PartyRole; children?: ReactNode; className?: string }) {
  const { open } = usePartyParam();
  return (
    <button
      type="button"
      className={className ? `pt-link ${className}` : "pt-link"}
      onClick={(event: MouseEvent) => {
        event.stopPropagation();
        open(name, role);
      }}
      title={`About ${name}`}
    >
      {children ?? name}
    </button>
  );
}
