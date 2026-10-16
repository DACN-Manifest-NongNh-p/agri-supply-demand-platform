import { useEffect, useRef, useState } from "react";
import { CircleCheck, TriangleAlert, X } from "lucide-react";
import { cellDayOffset, cellNumber, cellText, downloadCsv, isoDay, productName, readRows, toRecords, type Column } from "@/lib/spreadsheet";
import { formatDay, formatKg } from "../data/format";
import { matchDemand } from "../data/matching";
import { demands, producer, type Batch } from "../data/mockProducer";
import { FileDrop } from "./FileDrop";

type Draft = Omit<Batch, "code" | "allocatedKg" | "status">;
type Key = "product" | "variety" | "quantity" | "grade" | "plot" | "harvest" | "ready" | "sellBy";

const COLUMNS: Column<Key>[] = [
  { key: "product", label: "Product", aliases: ["Sản phẩm", "Loại trái cây", "Fruit", "Crop"], required: true },
  { key: "variety", label: "Variety", aliases: ["Giống", "Loại", "Ruột"], required: true },
  { key: "quantity", label: "Quantity (kg)", aliases: ["Quantity", "Kg", "Qty", "Số lượng", "Sản lượng", "Khối lượng"], required: true },
  { key: "grade", label: "Grade", aliases: ["Hạng", "Chất lượng", "Quality"] },
  { key: "plot", label: "Plot", aliases: ["Lô", "Vườn", "Field"] },
  { key: "harvest", label: "Harvest", aliases: ["Harvest date", "Ngày thu hoạch", "Thu hoạch"], required: true },
  { key: "ready", label: "Ready to sell", aliases: ["Ready", "Ready date", "Ngày bán", "Sẵn sàng"] },
  { key: "sellBy", label: "Sell by", aliases: ["Sell-by", "Sell by date", "Hạn bán", "Hạn sử dụng"], required: true },
];

const GRADES: Batch["grade"][] = ["A", "B", "C"];

type Row = { line: number; draft?: Draft; errors: string[]; matches: number };

type Props = { onClose: () => void; onDeclare: (drafts: Draft[]) => string[] };

/** Many batches at once from an Excel or CSV sheet, checked with the same rules as declaring one. */
export function ImportBatchesDialog({ onClose, onDeclare }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [fileName, setFileName] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [declared, setDeclared] = useState<string[] | null>(null);

  // No close() in cleanup: StrictMode re-runs effects and would close the dialog right away.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const read = async (file: File) => {
    setFileName(file.name);
    setBusy(true);
    setProblem("");
    try {
      const sheet = toRecords(await readRows(file), COLUMNS);
      if (sheet.missing.length > 0) {
        setRows([]);
        setProblem(`The sheet needs these columns: ${sheet.missing.join(", ")}. Use the sample file to see the layout.`);
        return;
      }
      setRows(
        sheet.records.map(({ line, values }) => {
          const errors: string[] = [];
          const productText = cellText(values.product);
          const product = productName(productText, producer.products);
          const quantityKg = cellNumber(values.quantity);
          const gradeText = cellText(values.grade).toUpperCase().replace(/GRADE|HẠNG|LOẠI/g, "").trim() || "A";
          const harvestDay = cellDayOffset(values.harvest);
          const readyCell = cellText(values.ready) ? cellDayOffset(values.ready) : harvestDay + 1;
          const sellByDay = cellDayOffset(values.sellBy);

          if (!product) errors.push("No product");
          if (!cellText(values.variety)) errors.push("No variety");
          if (!Number.isFinite(quantityKg) || quantityKg <= 0) errors.push("Quantity must be a number above 0");
          if (!GRADES.includes(gradeText as Batch["grade"])) errors.push(`Grade must be A, B or C (got "${cellText(values.grade)}")`);
          if (!Number.isFinite(harvestDay)) errors.push("Harvest is not a date");
          if (!Number.isFinite(readyCell)) errors.push("Ready to sell is not a date");
          if (!Number.isFinite(sellByDay)) errors.push("Sell by is not a date");
          if (Number.isFinite(harvestDay) && Number.isFinite(readyCell) && readyCell < harvestDay) errors.push("Ready is before harvest");
          if (Number.isFinite(readyCell) && Number.isFinite(sellByDay) && sellByDay <= readyCell) errors.push("Sell by must be after ready");
          if (errors.length > 0) return { line, errors, matches: 0 };

          const draft: Draft = {
            product,
            variety: cellText(values.variety),
            quantityKg,
            grade: gradeText as Batch["grade"],
            plot: cellText(values.plot) || "Unassigned plot",
            harvestDay,
            readyDay: readyCell,
            sellByDay,
            photos: [],
          };
          const candidate: Batch = { ...draft, code: "new", allocatedKg: 0, status: draft.readyDay <= 0 ? "ready" : "expected" };
          const matches = demands.filter((demand) => matchDemand(demand, [candidate]).best).length;
          return { line, draft, errors, matches };
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
    downloadCsv("farmora-batches-sample.csv", [
      ["Product", "Variety", "Quantity (kg)", "Grade", "Plot", "Harvest", "Ready to sell", "Sell by"],
      ["Dragon fruit", "Red flesh", 2400, "A", "Plot 6", isoDay(3), isoDay(4), isoDay(10)],
      ["Mango", "Cat Hoa Loc", 900, "B", "Orchard 2", isoDay(5), isoDay(6), isoDay(11)],
    ]);

  const good = rows.filter((row) => row.draft);

  return (
    <dialog
      ref={dialogRef}
      className="ph-form-dialog ph-import-dialog"
      aria-labelledby="import-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header className="ph-form-dialog-head">
        <div>
          <p className="ph-eyebrow">New supply</p>
          <h2 id="import-title">Import batches from a file</h2>
        </div>
        <button type="button" className="ph-btn ph-btn--icon" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </header>

      {declared ? (
        <div className="ph-declared">
          <CircleCheck size={36} />
          <h3>
            {declared.length} {declared.length === 1 ? "batch" : "batches"} declared
          </h3>
          <p>{declared.join(", ")}. Farmora matched them against open demand. Add photos to each batch so buyers can see them.</p>
          <div className="ph-declared-actions">
            <button type="button" className="ph-btn ph-btn--primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="ph-import-body">
          <p className="ph-section-sub">
            One batch per row. Columns are found by their header, in English or Vietnamese: <strong>Product</strong>, <strong>Variety</strong>,{" "}
            <strong>Quantity (kg)</strong>, <strong>Harvest</strong>, <strong>Sell by</strong>, and optionally Grade (A, B, C), Plot and Ready to sell.
          </p>
          <FileDrop onFile={(file) => void read(file)} onTemplate={template} fileName={fileName} busy={busy} />
          {problem && (
            <p className="ph-import-problem" role="alert">
              <TriangleAlert size={15} aria-hidden="true" /> {problem}
            </p>
          )}

          {rows.length > 0 && (
            <>
              <p className="ph-import-summary">
                {rows.length} {rows.length === 1 ? "row" : "rows"} read · {good.length} ready
                {rows.length > good.length && <span> · {rows.length - good.length} with errors (fix the file and drop it again)</span>}
              </p>
              <div className="ph-table-scroll">
                <table className="ph-import-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Batch</th>
                      <th className="ph-import-num">Quantity</th>
                      <th>Ready</th>
                      <th>Sell by</th>
                      <th>Matches</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.line} className={row.draft ? undefined : "is-error"}>
                        <td className="ph-muted">{row.line}</td>
                        {row.draft ? (
                          <>
                            <td>
                              <strong>
                                {row.draft.product} · {row.draft.variety}
                              </strong>
                              <small>
                                Grade {row.draft.grade} · {row.draft.plot}
                              </small>
                            </td>
                            <td className="ph-import-num">{formatKg(row.draft.quantityKg)}</td>
                            <td>{formatDay(row.draft.readyDay)}</td>
                            <td>{formatDay(row.draft.sellByDay)}</td>
                            <td>{row.matches > 0 ? `${row.matches} ${row.matches === 1 ? "demand" : "demands"}` : "None yet"}</td>
                          </>
                        ) : (
                          <td colSpan={5} className="ph-import-error">
                            <TriangleAlert size={14} aria-hidden="true" /> {row.errors.join(" · ")}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="ph-form-actions">
            <button type="button" className="ph-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="ph-btn ph-btn--primary" disabled={good.length === 0} onClick={() => setDeclared(onDeclare(good.map((row) => row.draft!)))}>
              Declare {good.length} {good.length === 1 ? "batch" : "batches"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
