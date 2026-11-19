import { useSearchParams } from "react-router-dom";
import { partyId, type PartyRole } from "@/lib/parties";

/** Search parameter that opens the party drawer: ?party=buyer:greenbasket-supermarkets */
export const PARTY_PARAM = "party";

export function usePartyParam() {
  const [params, setParams] = useSearchParams();
  const value = params.get(PARTY_PARAM);
  const [role, id] = value?.split(":") ?? [];
  const open = (name: string, as: PartyRole) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set(PARTY_PARAM, `${as}:${partyId(name)}`);
        return next;
      },
      { preventScrollReset: true },
    );
  const close = () =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete(PARTY_PARAM);
        return next;
      },
      { preventScrollReset: true },
    );
  return { role: role as PartyRole | undefined, id, open, close };
}

