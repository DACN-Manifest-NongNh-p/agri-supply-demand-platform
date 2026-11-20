// Product choice from the catalog the admin manages (lib/site), not a fixed list: a type-ahead box whose
// dropdown searches English and Vietnamese names; the buyer's usual products and live supply come first.
import { useId, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useSite } from "@/lib/site";

type Stats = { lots: number; price?: number };

const fold = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

export function ProductPicker({ value, onChange, usual, stats }: { value: string; onChange: (name: string) => void; usual: string[]; stats: (name: string) => Stats }) {
  const { products } = useSite();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);

  const active = products.filter((product) => product.active);
  const selected = active.find((product) => product.name === value);
  const term = fold(query.trim());
  const rank = (name: string) => (usual.includes(name) ? 0 : stats(name).lots > 0 ? 1 : 2);
  const options = active
    .filter((product) => !term || fold(`${product.name} ${product.nameVi ?? ""}`).includes(term))
    .sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));

  const choose = (name: string) => {
    onChange(name);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setCursor((current) => (options.length ? (current + step + options.length) % options.length : 0));
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      if (options[cursor]) choose(options[cursor].name);
    } else if (event.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  const shown = open ? query : selected ? `${selected.name}${selected.nameVi ? ` · ${selected.nameVi}` : ""}` : "";
  const info = selected ? stats(selected.name) : undefined;

  return (
    <div className="pp" onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && (setOpen(false), setQuery(""))}>
      <div className={open ? "pp-box is-open" : "pp-box"}>
        <Search size={16} aria-hidden="true" />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[cursor] ? `${listId}-${cursor}` : undefined}
          aria-label="Product"
          value={shown}
          placeholder={selected ? undefined : "Type a product, e.g. durian or xoài"}
          onFocus={() => {
            setOpen(true);
            setCursor(0);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setCursor(0);
          }}
          onKeyDown={onKey}
        />
        {selected && !open ? (
          <button type="button" className="pp-icon" aria-label="Clear product" onClick={() => onChange("")}>
            <X size={15} />
          </button>
        ) : (
          <ChevronDown size={16} aria-hidden="true" />
        )}

        {open && (
          <ul className="pp-list" id={listId} role="listbox" aria-label="Products">
            {options.length === 0 && <li className="pp-none">No product matches “{query}”. Ask Farmora to add it to the catalog.</li>}
            {options.map((product, index) => {
              const { lots, price } = stats(product.name);
              const firstOther = index > 0 && rank(product.name) === 2 && rank(options[index - 1].name) < 2;
              return (
                <li
                  key={product.name}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={product.name === value}
                  className={[index === cursor && "is-cursor", product.name === value && "is-on", firstOther && "pp-split"].filter(Boolean).join(" ") || undefined}
                  onMouseEnter={() => setCursor(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(product.name)}
                >
                  <span className="pp-name">
                    <strong>{product.name}</strong>
                    {product.nameVi && <span className="pp-vi">{product.nameVi}</span>}
                    {usual.includes(product.name) && <em>Usual</em>}
                  </span>
                  <small>{lots ? `${lots} lot${lots === 1 ? "" : "s"}${price ? ` · ~${price.toLocaleString("en-GB")} ₫/kg` : ""}` : "No supply yet"}</small>
                  {product.name === value && <Check size={15} aria-hidden="true" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {selected && info && !open && (
        <small className="pp-hint">{info.lots ? `${info.lots} lot${info.lots === 1 ? "" : "s"} on the market now${info.price ? ` · last price ~${info.price.toLocaleString("en-GB")} ₫/kg` : ""}` : "No supply on the market yet. Your order or demand will wait for it."}</small>
      )}
    </div>
  );
}
