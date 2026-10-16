import { useEffect, useState, type FormEvent } from "react";
import { Plus, Snowflake } from "lucide-react";
import { useSite, type CatalogProduct, type ProductCategory } from "@/lib/site";
import { listProducts, saveProduct } from "./data/adminApi";

const CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: "FRUIT", label: "Fruit" },
  { id: "VEGETABLE", label: "Vegetable" },
  { id: "OTHER", label: "Other" },
];

const blank = (sortOrder: number): CatalogProduct => ({ name: "", nameVi: "", category: "FRUIT", coldChain: false, active: true, sortOrder });

function ProductForm({ initial, onSave, onCancel, busy }: { initial: CatalogProduct; onSave: (product: CatalogProduct) => void; onCancel: () => void; busy: boolean }) {
  const [product, setProduct] = useState(initial);
  const set = <K extends keyof CatalogProduct>(key: K, value: CatalogProduct[K]) => setProduct((current) => ({ ...current, [key]: value }));
  return (
    <form
      className="ad-product-form"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        onSave({ ...product, name: product.name.trim(), nameVi: product.nameVi?.trim() || null });
      }}
    >
      <label className="ad-field">
        <span className="ad-label">Name (English)</span>
        <input className="ad-input" value={product.name} required maxLength={80} placeholder="e.g. Jackfruit" onChange={(event) => set("name", event.target.value)} />
      </label>
      <label className="ad-field">
        <span className="ad-label">Vietnamese name</span>
        <input className="ad-input" value={product.nameVi ?? ""} maxLength={80} placeholder="e.g. Mít" onChange={(event) => set("nameVi", event.target.value)} />
      </label>
      <label className="ad-field">
        <span className="ad-label">Category</span>
        <select className="ad-input" value={product.category} onChange={(event) => set("category", event.target.value as ProductCategory)}>
          {CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <label className="ad-field ad-field--narrow">
        <span className="ad-label">Order</span>
        <input className="ad-input" type="number" min={0} value={product.sortOrder} onChange={(event) => set("sortOrder", Number(event.target.value) || 0)} />
      </label>
      <label className="ad-switch">
        <input type="checkbox" checked={product.coldChain} onChange={(event) => set("coldChain", event.target.checked)} />
        Needs cold chain
      </label>
      <label className="ad-switch">
        <input type="checkbox" checked={product.active} onChange={(event) => set("active", event.target.checked)} />
        Available
      </label>
      <div className="ad-row-actions">
        <button type="button" className="ph-btn" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="ph-btn ph-btn--primary" disabled={busy || !product.name.trim()}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

/** What producers can declare and buyers can ask for. Switching a product off hides it from new batches and demands. */
export default function ProductsPage() {
  const { source } = useSite();
  const [items, setItems] = useState<CatalogProduct[] | null>(null);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listProducts()
      .then(setItems)
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load products."));
  }, []);

  const save = async (product: CatalogProduct) => {
    setBusy(true);
    setError("");
    try {
      setItems(await saveProduct(product));
      setEditing(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  const nextOrder = Math.max(0, ...(items ?? []).map((item) => item.sortOrder)) + 10;
  const active = (items ?? []).filter((item) => item.active).length;

  return (
    <main className="ph-main lg-page ad-page">
      <header className="lg-head lg-head--action">
        <div>
          <h1>Products</h1>
          <p>
            {items ? `${active} available of ${items.length}. ` : ""}Producers and buyers pick from these; the Vietnamese name also matches imported sheets.
          </p>
        </div>
        {editing === null && (
          <button type="button" className="ph-btn ph-btn--primary" onClick={() => setEditing("new")} disabled={source !== "api" || !items}>
            <Plus size={16} /> Add product
          </button>
        )}
      </header>

      {source !== "api" && <p className="ad-offline">The API is not reachable, so the catalog cannot be changed right now.</p>}
      {error && <p className="ad-offline">{error}</p>}

      <section className="ph-card ad-panel">
        {editing === "new" && <ProductForm initial={blank(nextOrder)} onSave={(product) => void save(product)} onCancel={() => setEditing(null)} busy={busy} />}
        {items === null ? (
          <p className="ad-muted">Loading…</p>
        ) : (
          <ul className="ad-products">
            {items.map((item) =>
              editing === item.id ? (
                <li key={item.id}>
                  <ProductForm initial={item} onSave={(product) => void save(product)} onCancel={() => setEditing(null)} busy={busy} />
                </li>
              ) : (
                <li key={item.id} className={item.active ? "ad-product" : "ad-product is-off"}>
                  <span className="ad-product-name">
                    <strong>{item.name}</strong>
                    {item.nameVi && <span>{item.nameVi}</span>}
                  </span>
                  <span className="ad-muted">{CATEGORIES.find((category) => category.id === item.category)?.label}</span>
                  <span className="ad-muted">{item.coldChain && <><Snowflake size={13} aria-hidden="true" /> Cold chain</>}</span>
                  <span className={item.active ? "ad-state ad-state--live" : "ad-state ad-state--off"}>{item.active ? "Available" : "Off"}</span>
                  <span className="ad-row-actions">
                    <button type="button" className="ph-btn" onClick={() => setEditing(item.id!)} disabled={busy || editing !== null}>
                      Edit
                    </button>
                    <button type="button" className="ph-btn" onClick={() => void save({ ...item, active: !item.active })} disabled={busy || editing !== null}>
                      {item.active ? "Turn off" : "Turn on"}
                    </button>
                  </span>
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </main>
  );
}
