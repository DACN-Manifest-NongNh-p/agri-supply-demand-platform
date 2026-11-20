# Buyer Flow

How this role fits into the whole system, and the demo order for all roles: [system flow and demo script](../system/README.md).

Access: all `/buyer` routes require the Keycloak `BUYER` role, and buyers land on `/buyer` after login (see [auth docs](../auth/README.md#frontend-routing-by-role)).

The buyer area follows the Farmora BRDs in `farmora_docs/analysis`:

| BRD | Scope | Pages |
|---|---|---|
| 0.1 B0-Buyer | Registration and verification | `/buyer/company` |
| 3 B3 | Shared trading rules, Transaction | `/buyer/transactions` |
| 3.3 B3.3 | Agricultural Order Matching (main channel) | `/buyer/orders` |
| 3.1 B3.1 | Buyer-led Procurement | `/buyer/demands` |
| 3.2 B3.2 | Supplier-led Auction | `/buyer/auctions` |

> **Status:** UI on demo data. All buyer state lives in `frontend/src/components/screens/Buyer/model/store.ts` (seeded from `model/seed.ts`). Suppliers, the coordinator and the matching engine are simulated in the browser, and nothing is persisted. The rules in `model/` are the ones the backend should implement.

## Core rules

- **The buyer chooses the mechanism** (BR-B3-01). There are three: buy orders, demands and auction bids. Nothing is bought straight off a lot: there is no reserve, no lock and no cart.
- **No payment on Farmora** (BR-B3-07). There is no deposit and no checkout. A confirmed result becomes a **Transaction**, which then goes through term sheet → contract → fulfilment → delivery. Payment follows the contract, outside Farmora.
- **Both sides confirm** before a Transaction exists (BR-B3-06).
- **Verification gate** (BR-B0B-07). An unverified buyer can browse the market and keep demand drafts. Every commitment is blocked until the business profile is `VERIFIED`: publishing a demand, negotiating, awarding, bidding, placing/changing/cancelling buy orders, and confirming results.
- **One quantity counter per supply lot.** Quantity is held only once a mechanism produces a result: an award, an auction allocation or a match result. It is released when the result is declined, rejected or expires.
- **Private prices.** The buyer never sees other parties' limit prices or bids. Only the clearing prices published after each session are visible.

## Pages

| Route | Page |
|---|---|
| `/buyer` | Home: things waiting for an answer, next session, entry to each mechanism |
| `/buyer/market`, `/market/:code` | Published supply lots (read-only), quality evidence, latest clearing prices |
| `/buyer/orders` | Buy orders, match results, session clock |
| `/buyer/orders/new`, `/orders/:code`, `/orders/:code/edit` | Place, follow, change or cancel a buy order |
| `/buyer/demands`, `/demands/new`, `/demands/:code`, `/demands/:code/edit` | Demand lifecycle |
| `/buyer/auctions`, `/auctions/:id` | Auctions, bid, confirm allocation |
| `/buyer/transactions`, `/transactions/:code` | Confirmed trades from every mechanism |
| `/buyer/company` | Business profile, documents, verification status |
| `/buyer/delivery-points` | Saved receiving addresses used by demands and buy orders |
| `/buyer/deliveries/:id` | Shipment tracking and problem reports for an active transaction |

## B0-Buyer: verification

Profile groups A–E: business, registered address, representative, procurement (optional), documents. The required documents depend on the representative type; an authorised representative also needs a letter of authorisation.

The profile moves `NOT_SUBMITTED → PENDING_VERIFICATION → UNDER_REVIEW → VERIFIED`, or to `NEEDS_ADDITIONAL_INFORMATION` / `REJECTED` with the coordinator's note. Editing a legal field of a verified profile sends it back to `PENDING_VERIFICATION` (FR-B0B-21). The demo simulates the coordinator. The page also has a "Demo: set verification status" control so you can see what each status blocks.

## B3.3: Order matching (main channel)

1. The buyer places a **buy order**: product, optional variety, minimum grade, quantity, **maximum price**, certifications, delivery location and zone, delivery window, and validity (`DAY` by default, or `GTC` with an end date).
2. Sessions run at **08:00, 11:00 and 14:00** (Vietnam time). The book closes 10 minutes before each one, and orders in that session's snapshot are **locked**: they cannot be changed or cancelled until the session has run.
3. The engine (`model/engine.ts`) groups orders by (product, variety, grade, zone). For each group it picks a **uniform clearing price**: the one with the largest matched volume, then the smallest imbalance, then the price nearest the reference or midpoint, then the lower price. It then allocates by **price–time priority**, with partial fills and several counter-orders allowed. Each buy/sell pair produces one **match result**.
4. The buyer **confirms** or **rejects** (with a reason) each match result before the deadline. Price and quantity are fixed. A result confirmed by both sides becomes a Transaction. A rejected or expired result returns its quantity to the order while the order is still valid.
5. Unmatched quantity carries over to the next session until the order is filled, cancelled or expires. Raising the price or the quantity resets time priority.

Demo: the "Run next session now" button runs the coming session immediately.

## B3.1: Buyer-led procurement

`DRAFT → PUBLISHED → CLOSED → UNDER_EVALUATION → AWARDED`, or `CANCELLED` / `NO_PROPOSAL`.

- **Create**: product, quantity, quality, delivery, commercial terms and extra requirements. The demand is saved as a draft and needs no verification yet.
- **Publish**: title, description, supplier scope (all suppliers or chosen regions), submission deadline (must fall before delivery) and optional weighted criteria (weights must total 100%). Quantity, quality and criteria are then frozen.
- **Close**: automatic at the deadline, or early with a reason. A closed demand can be reopened with a new deadline and a reason. Cancelling needs a reason at any stage before the award.
- **Evaluate**: a comparison table (sortable) shows quantity, price, quality evidence (self-declared vs document-verified), delivery date and evidence. The buyer can compare manually or by criteria score; the ranking is advice only. Proposals whose lot changed are marked `INVALID`.
- **Negotiate** per proposal: the buyer proposes new price, quantity or terms, and the supplier accepts, rejects or counters. Terms change only when the other side accepts. A proposal with an open round cannot be awarded.
- **Award**: one or more proposals at their (negotiated) quantities. The total is shown against the demand for reference only and is never blocked. Lots are held atomically, then each supplier confirms or declines. If a supplier declines, its quantity is released and the buyer can add another proposal.

## B3.2: Supplier-led auction

- Browse `SCHEDULED` and `ACTIVE` auctions, filtered by product and region and sorted by end time or starting price.
- Bid a **price (≥ starting price) and quantity (minimum bid ≤ quantity ≤ auction quantity)**. Each buyer has one live bid per auction, which can be updated or withdrawn while the auction is open. Other buyers' bids are hidden: visibility is still open question Q-02.
- After the auction ends, the **supplier chooses** bids and allocates quantity (possibly part of a bid). The buyer confirms or declines (with a reason) before the deadline. A confirmed allocation becomes a Transaction.

## Files

```
Buyer/
  model/      types, catalogs, time & sessions, matching engine, proposal scoring, validation, seed, store
  ui/         shared parts (pills, fields, reason dialog, history, gate, session strip), tones, address picker
  sections/   top bar, match card, publish panel, evaluation board, negotiation, address form
  *.tsx       pages
  data/       legacy prototype data still imported by the coordinator and producer areas
```

## Open questions taken as demo defaults

- Confirmation deadline (Q-03): the admin rule `holdHours`.
- Scoring conversion (A-06 / Q-05): see `model/evaluation.ts`; the rules are shown on the evaluation table.
- Auction bid visibility (Q-02): sealed, so buyers see only their own bid.
- Compatibility groups (Q-02 of B3.3): grouped by the buy side; sell orders that fit several groups are cleared group by group, so nothing is allocated twice.
