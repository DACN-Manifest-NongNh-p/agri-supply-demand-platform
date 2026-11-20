// Criteria-based evaluation of proposals (B3.1.5, option B). The ranking is advice only: the buyer
// may select any valid proposal (FR-B3.1-25). How each criterion turns into a 0–100 score is the
// demo's answer to open question A-06 / Q-05 and is shown next to the score.
import { DAY } from "./time";
import type { CriteriaType, Demand, Proposal, SupplyLot } from "./types";

export const SCORE_RULES: Record<CriteriaType, string> = {
  PRICE: "Lowest price scores 100; others in proportion (lowest ÷ price).",
  QUALITY: "Grade A 90, B 70, C 50; +10 when the lot's quality is document-verified.",
  CAPACITY: "Share of the demanded quantity the proposal covers.",
  DELIVERY_TIME: "100 inside the requested window; 20 points off per day outside it.",
};

export type ProposalScore = { proposal: Proposal; scores: Partial<Record<CriteriaType, number>>; total: number; rank: number };

const GRADE_SCORE = { A: 90, B: 70, C: 50 } as const;

function dayGap(date: string, from: string, to: string) {
  const at = Date.parse(date);
  if (date < from) return Math.round((Date.parse(from) - at) / DAY);
  if (date > to) return Math.round((at - Date.parse(to)) / DAY);
  return 0;
}

export function scoreProposals(demand: Demand, proposals: Proposal[], lots: SupplyLot[]): ProposalScore[] {
  if (proposals.length === 0) return [];
  const lowest = Math.min(...proposals.map((item) => item.agreed.price));
  const scored = proposals.map((proposal) => {
    const lot = lots.find((item) => item.code === proposal.lotCode);
    const raw: Record<CriteriaType, number> = {
      PRICE: Math.round((lowest / proposal.agreed.price) * 100),
      QUALITY: Math.min(100, (lot ? GRADE_SCORE[lot.grade] : 50) + (proposal.qualityEvidence === "DOCUMENT_VERIFIED" ? 10 : 0)),
      CAPACITY: Math.round(Math.min(1, proposal.agreed.quantity / demand.quantity) * 100),
      DELIVERY_TIME: Math.max(0, 100 - 20 * dayGap(proposal.deliveryDate, demand.deliveryFrom, demand.deliveryTo)),
    };
    const scores: Partial<Record<CriteriaType, number>> = {};
    let total = 0;
    for (const { type, weight } of demand.criteria) {
      scores[type] = raw[type];
      total += (raw[type] * weight) / 100;
    }
    return { proposal, scores, total: Math.round(total * 10) / 10, rank: 0 };
  });
  scored.sort((a, b) => b.total - a.total);
  scored.forEach((item, index) => (item.rank = index + 1));
  return scored;
}
