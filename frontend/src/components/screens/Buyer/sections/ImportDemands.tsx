import { useState } from "react";
import { ArrowRight, CircleCheck, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { cellDayOffset, cellNumber, cellText, downloadCsv, isoDay, productName, readRows, toRecords, type Column } from "@/lib/spreadsheet";
import { formatDay, formatKg } from "../../Producer/data/format";
import { FileDrop } from "../../Producer/sections/FileDrop";
import { rankSupply } from "../data/demands";
import { useBuyer } from "../data/buyerContext";
import { buyer, formatAddress, type BuyerDemand, type DeliveryAddress } from "../data/mockBuyer";

type Key = "product" | "quantity" | "grade" | "neededBy" | "deliverTo" | "note";

const COLUMNS: Column<Key>[] = [
  { key: "product", label: "Product", aliases: ["Sản phẩm", "Mặt hàng", "Loại trái cây", "Fruit", "Item"], required: true },
  { key: "quantity", label: "Quantity (kg)", aliases: ["Quantity", "Kg", "Qty", "Số lượng", "Số lượng (kg)", "Khối lượng"], required: true },
  { key: "grade", label: "Grade", aliases: ["Quality", "Chất lượng", "Loại", "Hạng"] },
  { key: "neededBy", label: "Needed by", aliases: ["Date", "Deadline", "Ngày cần", "Ngày giao", "Hạn"], required: true },
  { key: "deliverTo", label: "Deliver to", aliases: ["Delivery point", "Address", "Điểm giao", "Địa chỉ", "Nơi nhận"] },
  { key: "note", label: "Notes", aliases: ["Note", "Ghi chú", "Yêu cầu"] },
];

type Row = {
  line: number;
  demand?: Omit<BuyerDemand, "id" | "createdDay">;
  errors: string[];
  warnings: string[];
  fits: number;
};

/** "A", "a-b", "A–B", "any", "bất kỳ" → one of the grade options. */
function gradeOf(text: string): { grade: string; known: boolean } {
  const plain = text.toLowerCase().replace(/grade|loai|loại|hang|hạng/g, "").replace(/\s/g, "");
  if (!plain) return { grade: "Any grade", known: false };
  if (/^(any|all|batky|bấtkỳ|\*)$/.test(plain)) return { grade: "Any grade", known: true };
  if (/^a[-–/]?b$/.test(plain)) return { grade: "Grade A–B", known: true };
  if (plain === "a") return { grade: "Grade A", known: true };
  if (plain === "b") return { grade: "Grade B", known: true };
  return { grade: "Any grade", known: false };
}

function addressOf(text: string, addresses: DeliveryAddress[]) {
  const wanted = text.toLowerCase();
  return wanted ? addresses.find((item) => wanted.includes(item.label.toLowerCase()) || item.label.toLowerCase().includes(wanted)) : undefined;
}

/** Many demands at once from an Excel or CSV sheet: read, check each row, post the good ones. */
export function ImportDemands() {
  const { addDemands, addresses, supply } = useBuyer();
  const [fileName, setFileName] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [ignored, setIgnored] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const [posted, setPosted] = useState<string[] | null>(null);

  const known = [...new Set([...buyer.products, ...supply.map((batch) => batch.product)])];
  const fallback = addresses[0];

  const read = async (file: File) => {
    setFileName(file.name);
    setBusy(true);
    setProblem("");
    setPosted(null);
    try {
      const sheet = toRecords(await readRows(file), COLUMNS);
      if (sheet.missing.length > 0) {
        setRows([]);
        setProblem(`The sheet needs these columns: ${sheet.missing.join(", ")}. Use the sample file to see the layout.`);
        return;
      }
      setIgnored(sheet.ignored);
      setSkipped(new Set());
      setRows(
        sheet.records.map(({ line, values }) => {
          const errors: string[] = [];
          const warnings: string[] = [];
          const productText = cellText(values.product);
          const quantityKg = cellNumber(values.quantity);
          const neededByDay = cellDayOffset(values.neededBy);
          const grade = gradeOf(cellText(values.grade));
          const deliverText = cellText(values.deliverTo);
          const address = addressOf(deliverText, addresses) ?? fallback;

          if (!productText) errors.push("No product");
          if (!Number.isFinite(quantityKg) || quantityKg <= 0) errors.push("Quantity must be a number above 0");
          if (!Number.isFinite(neededByDay)) errors.push("Needed-by is not a date");
          else if (neededByDay < 1) errors.push("Needed-by must be tomorrow or later");
          if (!grade.known && cellText(values.grade)) warnings.push(`Grade "${cellText(values.grade)}" not recognised; Any grade used`);
          if (deliverText && !addressOf(deliverText, addresses)) warnings.push(`"${deliverText}" is not a saved delivery point; ${fallback?.label} used`);
          if (!address) errors.push("Add a delivery point first");

          if (errors.length > 0 || !address) return { line, errors, warnings, fits: 0 };
          const product = productName(productText, known);
          const demand = {
            product,
            quantityKg,
            gradeWanted: grade.grade,
            neededByDay,
            destination: formatAddress(address),
            addressId: address.id,
            deliveryWindow: address.receivingHours,
            note: cellText(values.note) || undefined,
          };
          const fits = rankSupply({ ...demand, id: "new", createdDay: 0 }, supply, quantityKg).candidates.length;
          return { line, demand, errors, warnings, fits };
        }),
      );
    } catch (error) {
      setRows([]);
      setProblem(error instanceof Error ? error.message : "The file could not be read.");
    } finally {
      setBusy(false);
    }
  };

  const template = () =>
    downloadCsv("farmora-demands-sample.csv", [
      ["Product", "Quantity (kg)", "Grade", "Needed by", "Deliver to", "Notes"],
      ["Dragon fruit", 2000, "A", isoDay(4), addresses[0]?.label ?? "", "Red flesh preferred"],
      ["Mango", 800, "A-B", isoDay(6), addresses[1]?.label ?? addresses[0]?.label ?? "", ""],
      ["Pomelo", 1200, "Any", isoDay(9), addresses[0]?.label ?? "", "For the weekend promotion"],
    ]);

  const ready = rows.filter((row) => row.demand && !skipped.has(row.line));
  const withErrors = rows.filter((row) => !row.demand).length;

  if (posted) {
    return (
      <div className="ph-card bu-import-done">
        <CircleCheck size={36} />
        <h2>{posted.length} {posted.length === 1 ? "demand" : "demands"} posted</h2>
        <p>
          {posted.join(", ")}. Farmora matched each against declared supply; new batches are matched against them automatically.
        </p>
        <div className="ph-declared-actions">
          <Link to="/buyer/demands?status=open" className="ph-btn ph-btn--primary">
            See my demands <ArrowRight size={15} />
          </Link>
          <button
            type="button"
            className="ph-btn"
            onClick={() => {
              setPosted(null);
              setRows([]);
              setFileName(undefined);
            }}
          >
            Import another file
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bu-import">
      <section className="ph-card bu-import-head">
        <h2>Import demands from a file</h2>
        <p className="ph-section-sub">
          One demand per row. Columns are found by their header, in English or Vietnamese: <strong>Product</strong>, <strong>Quantity (kg)</strong>,{" "}
          <strong>Needed by</strong>, and optionally Grade, Deliver to (the name of a saved delivery point) and Notes.
        </p>
        <FileDrop onFile={(file) => void read(file)} onTemplate={template} fileName={fileName} busy={busy} />
        {problem && (
          <p className="bu-import-problem" role="alert">
            <TriangleAlert size={15} aria-hidden="true" /> {problem}
          </p>
        )}
      </section>

      {rows.length > 0 && (
        <section className="ph-card bu-import-preview" aria-labelledby="import-preview-title">
          <div className="ph-section-head">
            <div>
              <h2 id="import-preview-title">Check before posting</h2>
              <p className="ph-section-sub">
                {rows.length} {rows.length === 1 ? "row" : "rows"} read · {rows.length - withErrors} ready
                {withErrors > 0 && <span className="bu-import-bad"> · {withErrors} with errors (fix the file and drop it again)</span>}
                {ignored.length > 0 && <> · ignored columns: {ignored.join(", ")}</>}
              </p>
            </div>
          </div>

          <div className="ph-table-scroll">
            <table className="bu-import-table">
              <thead>
                <tr>
                  <th>
                    <span className="ph-sr-only">Include</span>
                  </th>
                  <th>Row</th>
                  <th>Product</th>
                  <th className="bu-num">Quantity</th>
                  <th>Grade</th>
                  <th>Needed by</th>
                  <th>Deliver to</th>
                  <th>Supply now</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const included = Boolean(row.demand) && !skipped.has(row.line);
                  return (
                    <tr key={row.line} className={row.demand ? (included ? undefined : "is-skipped") : "is-error"}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Include row ${row.line}`}
                          checked={included}
                          disabled={!row.demand}
                          onChange={() =>
                            setSkipped((current) => {
                              const next = new Set(current);
                              if (next.has(row.line)) next.delete(row.line);
                              else next.add(row.line);
                              return next;
                            })
                          }
                        />
                      </td>
                      <td className="ph-muted">{row.line}</td>
                      {row.demand ? (
                        <>
                          <td>
                            <strong>{row.demand.product}</strong>
                            {row.warnings.map((warning) => (
                              <small key={warning} className="bu-import-warn">
                                {warning}
                              </small>
                            ))}
                          </td>
                          <td className="bu-num">{formatKg(row.demand.quantityKg)}</td>
                          <td>{row.demand.gradeWanted}</td>
                          <td>{formatDay(row.demand.neededByDay)}</td>
                          <td>{row.demand.destination.split(",")[0]}</td>
                          <td>
                            <span className={row.fits > 0 ? "bu-import-fit is-yes" : "bu-import-fit"}>
                              {row.fits > 0 ? `${row.fits} ${row.fits === 1 ? "batch fits" : "batches fit"}` : "None yet"}
                            </span>
                          </td>
                        </>
                      ) : (
                        <td colSpan={6} className="bu-import-error">
                          <TriangleAlert size={14} aria-hidden="true" /> {row.errors.join(" · ")}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bu-import-actions">
            <button
              type="button"
              className="ph-btn ph-btn--primary"
              disabled={ready.length === 0}
              onClick={() => setPosted(addDemands(ready.map((row) => row.demand!)))}
            >
              Post {ready.length} {ready.length === 1 ? "demand" : "demands"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
