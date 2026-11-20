// The five demos on the landing page, one per part of the Farmora flow. Every figure is example data
// and every step follows the BRDs: verification gate, sealed limit prices, both sides confirm, no
// payment on the platform. Each demo has its own accent, each step its own name and spotlight.
import { Check, CheckCircle2, Clock, FileText, Gavel, ListOrdered, Lock, Megaphone, ShieldCheck, Truck, Upload } from "lucide-react";
import { Countdown, DemoPlayer, Typed, type DemoStep } from "./DemoPlayer";
import { ACCENT, focus } from "./demoFocus";

const on = (step: number, from: number) => step >= from;

// ── 1. Verification (B0) ───────────────────────────────────────────────────

const VERIFY: DemoStep[] = [
  { title: "Business details", ms: 2800, caption: "The buyer declares the business behind the account", cursor: [46, 30] },
  { title: "Upload document", ms: 2400, caption: "…uploads the business registration certificate", cursor: [30, 62], click: true },
  { title: "Submit", ms: 2000, caption: "…and submits the profile for review", cursor: [80, 86], click: true },
  { title: "Coordinator review", ms: 2800, caption: "A Farmora coordinator checks the business, then the representative", cursor: [86, 50] },
  { title: "Verified", ms: 2800, caption: "Verified: publishing, bidding, ordering and confirming are unlocked", cursor: [70, 22] },
];

export function VerifyDemo() {
  return (
    <DemoPlayer
      name="Verification"
      icon={ShieldCheck}
      accent={ACCENT.verify}
      label="Demo: verifying a buyer business"
      url="/buyer/company"
      steps={VERIFY}
      render={(s) => (
        <div className="dm-split">
          <div className="dm-card dm-grow">
            <p className="dm-kicker">A. Business</p>
            <div className="dm-field">
              <small>Business name</small>
              <div className={focus(s === 0, "dm-input")}>
                <Typed text="GreenBasket Supermarkets" active={s === 0} done={s > 0} />
              </div>
            </div>
            <div className="dm-row2">
              <div className="dm-field">
                <small>Type</small>
                <div className="dm-input">Retailer</div>
              </div>
              <div className="dm-field">
                <small>Tax code</small>
                <div className="dm-input">0314552908</div>
              </div>
            </div>
            <p className="dm-kicker">E. Documents</p>
            {on(s, 1) ? (
              <div className={focus(s === 1, "dm-file is-in")}>
                <FileText size={14} /> business-registration.pdf <Check size={14} className="dm-ok" />
              </div>
            ) : (
              <div className="dm-upload">
                <Upload size={14} /> Upload file
              </div>
            )}
            <div className="dm-actions">
              <span className={focus(s === 2, s === 2 ? "dm-btn dm-btn--primary is-pressed" : "dm-btn dm-btn--primary")}>{on(s, 2) ? "Submitted" : "Submit for verification"}</span>
            </div>
          </div>
          <div className={focus(s === 3, "dm-card dm-side")}>
            <p className="dm-kicker">Status</p>
            <ol className="dm-steps">
              <li className={on(s, 2) ? "is-done" : "is-now"}>Profile</li>
              <li className={on(s, 3) ? "is-done" : on(s, 2) ? "is-now" : ""}>Submitted</li>
              <li className={on(s, 4) ? "is-done" : on(s, 3) ? "is-now" : ""}>Business checked</li>
              <li className={on(s, 4) ? "is-done" : ""}>Representative checked</li>
            </ol>
            {on(s, 4) ? (
              <span className={focus(true, "dm-pill dm-pill--good dm-pop dm-pill--big")}>
                <ShieldCheck size={16} /> Verified buyer
              </span>
            ) : (
              <span className="dm-pill dm-pill--warn">
                <Lock size={13} /> Trading locked
              </span>
            )}
          </div>
        </div>
      )}
    />
  );
}

// ── 2. Order matching (B3.3) ───────────────────────────────────────────────

const MATCHING: DemoStep[] = [
  { title: "Quantity", ms: 2800, caption: "Buyer places a buy order: product, minimum grade, quantity", cursor: [30, 42] },
  { title: "Max price", ms: 2400, caption: "…and the highest price they accept. Nobody else sees it", cursor: [30, 62] },
  { title: "Join the book", ms: 2200, caption: "The order joins the book for the next session at 11:00", cursor: [26, 84], click: true },
  { title: "Session match", ms: 3200, caption: "At 11:00 the engine sets one clearing price for the product group", cursor: [74, 40] },
  { title: "Match result", ms: 2600, caption: "A match result: 1,500 kg at 31,800 ₫/kg, below the buyer's maximum", cursor: [74, 60] },
  { title: "Both confirm", ms: 2600, caption: "Both sides confirm → a transaction is created", cursor: [86, 86], click: true },
];

const BOOK = [
  { side: "Buy", who: "You", qty: "2,000 kg", price: "33,000", mine: true },
  { side: "Buy", who: "Buyer", qty: "800 kg", price: "•••" },
  { side: "Sell", who: "Supplier", qty: "1,500 kg", price: "•••" },
  { side: "Sell", who: "Supplier", qty: "900 kg", price: "•••" },
];

export function MatchingDemo() {
  return (
    <DemoPlayer
      name="Order matching"
      icon={ListOrdered}
      accent={ACCENT.matching}
      label="Demo: a buy order matched in a session"
      url="/buyer/orders/new"
      steps={MATCHING}
      render={(s) => (
        <div className="dm-split">
          <div className="dm-card dm-grow">
            <p className="dm-kicker">Buy order</p>
            <div className="dm-row2">
              <div className="dm-field">
                <small>Product</small>
                <div className="dm-input">Mango · Grade B+</div>
              </div>
              <div className="dm-field">
                <small>Valid</small>
                <div className="dm-input">Day order</div>
              </div>
            </div>
            <div className="dm-field">
              <small>Quantity</small>
              <div className={focus(s === 0, "dm-input")}>
                <Typed text="2,000 kg" active={s === 0} done={s > 0} />
              </div>
            </div>
            <div className="dm-field">
              <small>Maximum price</small>
              <div className={focus(s === 1, "dm-input")}>
                <Typed text="33,000 ₫/kg" active={s === 1} done={s > 1} />
              </div>
            </div>
            <div className="dm-actions">
              <span className={focus(s === 2, s === 2 ? "dm-btn dm-btn--primary is-pressed" : "dm-btn dm-btn--primary")}>{on(s, 2) ? "Placed · BO-1042" : "Place buy order"}</span>
            </div>
          </div>

          <div className="dm-card dm-side">
            {s < 4 ? (
              <>
                <p className="dm-kicker">
                  <Clock size={12} /> {s < 3 ? "Order book · next session 11:00" : "11:00 session · matching"}
                </p>
                <ul className="dm-book">
                  {BOOK.map((row, index) => (
                    <li
                      key={index}
                      className={[row.mine && on(s, 2) ? "is-mine" : "", row.mine && !on(s, 2) ? "is-hidden" : "", s === 3 && index !== 1 && index !== 3 ? "is-hit" : "", row.mine && s === 2 ? "dm-focus" : ""].join(" ")}
                    >
                      <span className={row.side === "Buy" ? "dm-tag dm-tag--buy" : "dm-tag dm-tag--sell"}>{row.side}</span>
                      <span>{row.who}</span>
                      <span>{row.qty}</span>
                      <b>{row.price}</b>
                    </li>
                  ))}
                </ul>
                {s === 3 && (
                  <div className="dm-clear dm-pop dm-focus">
                    <small>Clearing price</small>
                    <strong>31,800 ₫/kg</strong>
                    <small>Mango · Grade B · HCMC</small>
                  </div>
                )}
              </>
            ) : (
              <div className={focus(s === 4, "dm-match dm-pop")}>
                <p className="dm-kicker">Match result MR-8840</p>
                <strong className="dm-big">1,500 kg · 31,800 ₫/kg</strong>
                <p className="dm-muted">Thuan Nam Mango Growers · lot SL-MG-334</p>
                <ul className="dm-confirm">
                  <li className={on(s, 5) ? "is-yes" : ""}>
                    <CheckCircle2 size={14} /> You {on(s, 5) ? "confirmed" : "— not yet"}
                  </li>
                  <li className="is-yes">
                    <CheckCircle2 size={14} /> Supplier confirmed
                  </li>
                </ul>
                {on(s, 5) ? (
                  <span className="dm-pill dm-pill--good dm-pop dm-focus">Transaction TX-3014 created</span>
                ) : (
                  <span className="dm-actions">
                    <span className="dm-btn">Reject</span>
                    <span className="dm-btn dm-btn--primary">Confirm</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    />
  );
}

// ── 3. Buyer-led procurement (B3.1) ────────────────────────────────────────

const PROCUREMENT: DemoStep[] = [
  { title: "Publish demand", ms: 2800, caption: "Buyer publishes a demand with a submission deadline", cursor: [80, 20] },
  { title: "Proposals arrive", ms: 2800, caption: "Verified suppliers send proposals from their own supply lots", cursor: [60, 55] },
  { title: "Compare", ms: 2800, caption: "At the deadline submissions close: compare price, quality and delivery", cursor: [86, 46] },
  { title: "Negotiate", ms: 2800, caption: "Negotiate a proposal: terms change only if the supplier accepts", cursor: [66, 64] },
  { title: "Award", ms: 2400, caption: "Select one or more suppliers and confirm the award", cursor: [84, 88], click: true },
  { title: "Suppliers confirm", ms: 2600, caption: "Each supplier confirms → one transaction per supplier", cursor: [84, 88] },
];

const PROPOSALS = [
  { who: "Thuan Nam Mango Growers", qty: "1,500 kg", price: "38,000", quality: "A · verified", score: 86 },
  { who: "Green Hills Farm", qty: "1,200 kg", price: "34,500", quality: "B · declared", score: 74 },
  { who: "Tanh Linh Orchard", qty: "800 kg", price: "36,000", quality: "B · declared", score: 61 },
];

export function ProcurementDemo() {
  return (
    <DemoPlayer
      name="Procurement"
      icon={Megaphone}
      accent={ACCENT.procurement}
      label="Demo: a demand from publishing to award"
      url="/buyer/demands/DM-0592"
      steps={PROCUREMENT}
      render={(s) => (
        <div className="dm-stack">
          <div className={focus(s === 0, "dm-card dm-head")}>
            <div>
              <p className="dm-kicker">Demand DM-0592</p>
              <strong>2,000 kg Cat Hoa Loc mango · deliver in 4 days</strong>
            </div>
            {s < 2 ? (
              <span className="dm-pill dm-pill--info">
                Closes in <Countdown from={7200} active={s < 2} />
              </span>
            ) : s < 5 ? (
              <span className="dm-pill dm-pill--warn">Under evaluation</span>
            ) : (
              <span className="dm-pill dm-pill--good">Awarded</span>
            )}
          </div>

          <div className="dm-card dm-grow">
            {s === 0 && <p className="dm-muted dm-center">Published · waiting for proposals…</p>}
            {s === 1 && (
              <ul className="dm-sealed">
                {PROPOSALS.map((item, index) => (
                  <li key={item.who} className="dm-slide dm-focus" style={{ animationDelay: `${index * 500}ms` }}>
                    <Lock size={13} /> Proposal from {item.who}
                    <span>opens at the deadline</span>
                  </li>
                ))}
              </ul>
            )}
            {on(s, 2) && (
              <table className={focus(s === 2, "dm-table")}>
                <thead>
                  <tr>
                    <th />
                    <th>Supplier</th>
                    <th>Qty</th>
                    <th>₫/kg</th>
                    <th>Quality</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {PROPOSALS.map((item, index) => {
                    const picked = on(s, 4) && index < 2;
                    const price = index === 0 && on(s, 3) ? "37,000" : item.price;
                    return (
                      <tr key={item.who} className={picked ? "is-picked" : ""}>
                        <td>
                          <span className={picked ? "dm-check is-on" : "dm-check"}>{picked && <Check size={11} />}</span>
                        </td>
                        <td>{item.who}</td>
                        <td>{item.qty}</td>
                        <td>
                          {index === 0 && on(s, 3) && <s>38,000</s>} <b>{price}</b>
                        </td>
                        <td>{item.quality}</td>
                        <td>
                          <span className="dm-score">
                            <span style={{ width: `${item.score}%` }} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {s === 3 && (
              <div className="dm-chat dm-focus">
                <p className="dm-bubble dm-bubble--me dm-pop">Can you do 37,000 for 1,500 kg?</p>
                <p className="dm-bubble dm-pop" style={{ animationDelay: "900ms" }}>
                  Thuan Nam: Accepted ✓
                </p>
              </div>
            )}
            {on(s, 4) && (
              <div className={focus(true, "dm-award")}>
                <span>2 selected · 2,700 kg of 2,000 kg (your choice, not blocked)</span>
                {s === 4 ? (
                  <span className="dm-btn dm-btn--primary is-pressed">Confirm award</span>
                ) : (
                  <span className="dm-pill dm-pill--good dm-pop">
                    <CheckCircle2 size={14} /> Both suppliers confirmed
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    />
  );
}

// ── 4. Supplier-led auction (B3.2) ─────────────────────────────────────────

const AUCTION: DemoStep[] = [
  { title: "Auction opens", ms: 2600, caption: "A supplier auctions a lot with a starting price and minimum bid", cursor: [30, 30] },
  { title: "Place bid", ms: 2800, caption: "Buyer bids a price and a quantity; other bids stay hidden", cursor: [76, 40] },
  { title: "Update bid", ms: 2200, caption: "Bids can be changed or withdrawn until the auction ends", cursor: [76, 70], click: true },
  { title: "Supplier allocates", ms: 3000, caption: "The supplier chooses bids and allocates quantity, not only the highest price", cursor: [40, 64] },
  { title: "Confirm", ms: 2600, caption: "The buyer confirms the allocation → transaction", cursor: [76, 62], click: true },
];

export function AuctionDemo() {
  return (
    <DemoPlayer
      name="Auction"
      icon={Gavel}
      accent={ACCENT.auction}
      label="Demo: bidding in a supplier auction"
      url="/buyer/auctions/AU-311"
      steps={AUCTION}
      render={(s) => (
        <div className="dm-split">
          <div className={focus(s === 0, "dm-card dm-grow")}>
            <p className="dm-kicker">Auction AU-311 · Hoa Phat Cooperative</p>
            <strong className="dm-big">Red-flesh dragon fruit</strong>
            <div className="dm-facts">
              <span>
                <small>Quantity</small>1,500 kg
              </span>
              <span>
                <small>Start price</small>25,000 ₫
              </span>
              <span>
                <small>Min. bid</small>200 kg
              </span>
            </div>
            {s < 3 ? (
              <p className="dm-pill dm-pill--info">
                Ends in <Countdown from={10740} active={s < 3} />
              </p>
            ) : (
              <div className={focus(s === 3, "dm-alloc-wrap")}>
                <p className="dm-kicker">Supplier allocates</p>
                <ul className="dm-alloc">
                  <li className="is-on dm-slide">
                    <span>You · 27,000 × 800 kg</span>
                    <b>800 kg</b>
                  </li>
                  <li className="is-on dm-slide" style={{ animationDelay: "400ms" }}>
                    <span>Buyer · 26,200 × 1,000 kg</span>
                    <b>700 kg</b>
                  </li>
                  <li className="dm-slide" style={{ animationDelay: "800ms" }}>
                    <span>Buyer · 27,500 × 1,500 kg</span>
                    <b>—</b>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className={focus(s === 1 || s === 2 || s === 4, "dm-card dm-side")}>
            <p className="dm-kicker">{s < 3 ? "Your bid" : "Result for you"}</p>
            {s < 3 ? (
              <>
                <div className="dm-field">
                  <small>Price</small>
                  <div className="dm-input">{s === 2 ? <b className="dm-changed">27,000 ₫/kg</b> : <Typed text="26,500 ₫/kg" active={s === 1} done={s > 1} />}</div>
                </div>
                <div className="dm-field">
                  <small>Quantity</small>
                  <div className="dm-input">{on(s, 1) && "800 kg"}</div>
                </div>
                <span className={s === 2 ? "dm-btn dm-btn--primary is-pressed" : "dm-btn dm-btn--primary"}>{s === 2 ? "Update bid" : "Submit bid"}</span>
                {s === 2 && <p className="dm-muted dm-pop">26,500 → 27,000 · kept in history</p>}
              </>
            ) : (
              <div className="dm-pop">
                <strong className="dm-big">800 kg · 27,000 ₫/kg</strong>
                <p className="dm-muted">Confirm within 24 h</p>
                {s === 4 ? (
                  <span className="dm-pill dm-pill--good dm-pop">
                    <CheckCircle2 size={14} /> Confirmed · TX-3015
                  </span>
                ) : (
                  <span className="dm-actions">
                    <span className="dm-btn">Decline</span>
                    <span className="dm-btn dm-btn--primary">Confirm</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    />
  );
}

// ── 5. Transaction to delivery ─────────────────────────────────────────────

const TX: DemoStep[] = [
  { title: "Transaction", ms: 2400, caption: "Every confirmed result becomes a transaction with the agreed terms", cursor: [20, 70] },
  { title: "Term sheet", ms: 2200, caption: "The terms go into a term sheet", cursor: [38, 40] },
  { title: "Contract", ms: 2200, caption: "The contract is signed and becomes active", cursor: [56, 40] },
  { title: "On the road", ms: 3400, caption: "The shipment is tracked to the buyer's dock", cursor: [70, 72] },
  { title: "Delivered", ms: 2600, caption: "Delivered with proof. Payment follows the contract, outside Farmora", cursor: [88, 40] },
];

const TX_STEPS = ["Confirmed", "Term sheet", "Contract", "On the road", "Delivered"];

export function TransactionDemo() {
  return (
    <DemoPlayer
      name="Transaction"
      icon={Truck}
      accent={ACCENT.transaction}
      label="Demo: a transaction from confirmation to delivery"
      url="/buyer/transactions/TX-3011"
      steps={TX}
      render={(s) => (
        <div className="dm-stack">
          <div className="dm-card dm-head">
            <div>
              <p className="dm-kicker">Transaction TX-3011 · order matching</p>
              <strong>1,000 kg Da xanh pomelo · 34,500 ₫/kg</strong>
            </div>
            <span className={s === 4 ? "dm-pill dm-pill--good" : "dm-pill dm-pill--info"}>{TX_STEPS[s]}</span>
          </div>
          <div className={focus(s === 1 || s === 2, "dm-card")}>
            <ol className="dm-track">
              {TX_STEPS.map((label, index) => (
                <li key={label} className={index < s ? "is-done" : index === s ? "is-now" : ""}>
                  <i />
                  <span>{label}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className={focus(s === 0 || s >= 3, "dm-card dm-grow")}>
            {s < 3 ? (
              <div className="dm-terms">
                {[
                  ["Quantity", "1,000 kg"],
                  ["Price", "34,500 ₫/kg"],
                  ["Quality", "Grade A, document-verified"],
                  ["Delivery", "GreenBasket DC, District 7"],
                ].map(([k, v]) => (
                  <span key={k}>
                    <small>{k}</small>
                    {v}
                  </span>
                ))}
              </div>
            ) : (
              <div className="dm-route">
                <span className="dm-route-end">Muong Man, Binh Thuan</span>
                <span className="dm-road">
                  <span className={s === 4 ? "dm-truck is-there" : "dm-truck"}>
                    <Truck size={18} />
                  </span>
                </span>
                <span className="dm-route-end">District 7, HCMC</span>
                {s === 4 && <p className="dm-pill dm-pill--good dm-pop">Signed for at dock 3 · 05:42</p>}
              </div>
            )}
          </div>
        </div>
      )}
    />
  );
}
