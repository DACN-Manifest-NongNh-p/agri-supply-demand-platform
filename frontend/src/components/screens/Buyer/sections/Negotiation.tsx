// B3.1.6 negotiation on one selected proposal: rounds of new price/quantity/terms; terms change only
// when the other side accepts (BR-B3.1-12). Every round is kept (FR-B3.1-30).
import { useState } from "react";
import { NEGOTIATION_LABEL } from "../model/catalog";
import { answerCounter, counterSupplier, proposeTerms, withdrawTerms } from "../model/store";
import { formatDateTime } from "../model/time";
import type { Proposal } from "../model/types";
import type { Errors } from "../model/validation";
import { Field, FormError, Pill } from "../ui/parts";
import { kg, perKg } from "../ui/format";

function TermsForm({ proposal, label, onSubmit }: { proposal: Proposal; label: string; onSubmit: (input: { price?: number; quantity?: number; terms?: string; note?: string }) => Errors | null }) {
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [terms, setTerms] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  return (
    <form
      className="bf-terms-form"
      onSubmit={(event) => {
        event.preventDefault();
        const result = onSubmit({ price: price ? Number(price) : undefined, quantity: quantity ? Number(quantity) : undefined, terms: terms.trim() || undefined, note: note.trim() || undefined });
        if (result) setErrors(result);
        else {
          setErrors({});
          setPrice("");
          setQuantity("");
          setTerms("");
          setNote("");
        }
      }}
    >
      <div className="bf-grid bf-grid--3">
        <Field label="New price (VND/kg)" error={errors.price} hint={`Now ${perKg(proposal.agreed.price)}`}>
          <input type="number" min={1} step={100} value={price} onChange={(event) => setPrice(event.target.value)} />
        </Field>
        <Field label="New quantity (kg)" error={errors.quantity} hint={`Now ${kg(proposal.agreed.quantity)}`}>
          <input type="number" min={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        </Field>
        <Field label="Other terms">
          <input value={terms} placeholder="Delivery date, packing…" onChange={(event) => setTerms(event.target.value)} />
        </Field>
        <Field label="Note to the supplier" wide>
          <input value={note} onChange={(event) => setNote(event.target.value)} />
        </Field>
      </div>
      <FormError errors={errors} />
      <button type="submit" className="ph-btn">
        {label}
      </button>
    </form>
  );
}

export function Negotiation({ proposal, canNegotiate }: { proposal: Proposal; canNegotiate: boolean }) {
  const pending = proposal.negotiations.find((round) => round.status === "PENDING");
  const [errors, setErrors] = useState<Errors>({});
  const [countering, setCountering] = useState(false);

  return (
    <div className="bf-negotiation">
      <h4>Negotiation</h4>
      {proposal.negotiations.length === 0 ? (
        <p className="ph-muted">No rounds yet. The proposal's own terms apply unless the supplier accepts new ones.</p>
      ) : (
        <ol className="bf-rounds">
          {proposal.negotiations.map((round) => (
            <li key={round.round} className={round.by === "BUYER" ? "is-buyer" : "is-supplier"}>
              <span className="bf-code">
                Round {round.round} · {round.by === "BUYER" ? "You" : proposal.supplier} · {formatDateTime(round.at)}
              </span>
              <span>
                {[round.price && perKg(round.price), round.quantity && kg(round.quantity), round.terms].filter(Boolean).join(" · ")}
                {round.note && <em> “{round.note}”</em>}
              </span>
              <Pill tone={round.status === "ACCEPTED" ? "good" : round.status === "PENDING" ? "warn" : "muted"}>{NEGOTIATION_LABEL[round.status]}</Pill>
            </li>
          ))}
        </ol>
      )}

      <FormError errors={errors} />
      {canNegotiate && pending?.by === "BUYER" && (
        <p className="bf-actions">
          <span className="ph-muted">Waiting for {proposal.supplier}. The award cannot include this proposal until they answer or you withdraw.</span>
          <button type="button" className="ph-btn" onClick={() => withdrawTerms(proposal.code)}>
            Withdraw offer
          </button>
        </p>
      )}
      {canNegotiate && pending?.by === "SUPPLIER" && (
        <>
          <p className="bf-actions">
            <span className="ph-muted">{proposal.supplier} proposed new terms. Accept, reject (original terms stay) or counter.</span>
            <button type="button" className="ph-btn" onClick={() => setCountering(true)}>
              Counter
            </button>
            <button
              type="button"
              className="ph-btn"
              onClick={() => {
                const result = answerCounter(proposal.code, "REJECT");
                setErrors(result.ok ? {} : result.errors);
              }}
            >
              Reject
            </button>
            <button
              type="button"
              className="ph-btn ph-btn--primary"
              onClick={() => {
                const result = answerCounter(proposal.code, "ACCEPT");
                setErrors(result.ok ? {} : result.errors);
              }}
            >
              Accept
            </button>
          </p>
          {countering && (
            <TermsForm
              proposal={proposal}
              label="Send counter"
              onSubmit={(input) => {
                const result = counterSupplier(proposal.code, input);
                if (result.ok) setCountering(false);
                return result.ok ? null : result.errors;
              }}
            />
          )}
        </>
      )}
      {canNegotiate && !pending && (
        <TermsForm
          proposal={proposal}
          label="Propose new terms"
          onSubmit={(input) => {
            const result = proposeTerms(proposal.code, input);
            return result.ok ? null : result.errors;
          }}
        />
      )}
    </div>
  );
}
