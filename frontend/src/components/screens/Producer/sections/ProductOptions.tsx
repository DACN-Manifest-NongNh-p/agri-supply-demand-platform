import { useSite } from "@/lib/site";

/**
 * Options for a product dropdown: the account's usual products first, then every other active
 * product in the catalog the admin manages. The caller adds its own "Other…" option.
 */
export function ProductOptions({ usual }: { usual: string[] }) {
  const { products } = useSite();
  const rest = products.filter((product) => product.active && !usual.includes(product.name));
  return (
    <>
      <optgroup label="Usual">
        {usual.map((name) => (
          <option key={name}>{name}</option>
        ))}
      </optgroup>
      {rest.length > 0 && (
        <optgroup label="All products">
          {rest.map((product) => (
            <option key={product.name} value={product.name}>
              {product.nameVi ? `${product.name} (${product.nameVi})` : product.name}
            </option>
          ))}
        </optgroup>
      )}
    </>
  );
}
