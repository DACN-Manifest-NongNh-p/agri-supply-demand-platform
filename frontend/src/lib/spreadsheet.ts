// Reading demands or batches from a spreadsheet the user uploads: .xlsx (via read-excel-file,
// loaded only when needed) or .csv. Columns are found by their header, in English or Vietnamese,
// so users can keep their own sheet layout.
import { getSite } from "@/lib/site";

export type Cell = string | number | boolean | Date | null;

export const ACCEPTED_FILES = ".xlsx,.csv";

/** "Số lượng (kg)" → "soluongkg": lower case, no accents, letters and digits only. */
export function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Splits CSV text into rows, handling quoted cells; the separator is a comma or a semicolon. */
function parseCsv(text: string): Cell[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const separator = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: Cell[][] = [];
  let row: Cell[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === separator) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** All rows of the first sheet (or of the CSV file), as raw cells. */
export async function readRows(file: File): Promise<Cell[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return parseCsv((await file.text()).replace(/^\uFEFF/, ""));
  if (name.endsWith(".xlsx")) {
    const { readSheet } = await import("read-excel-file/browser");
    return (await readSheet(file)) as Cell[][];
  }
  throw new Error("Use an Excel (.xlsx) or CSV file.");
}

export type Column<K extends string> = { key: K; label: string; aliases: string[]; required?: boolean };

export type SheetRecord<K extends string> = { line: number; values: Partial<Record<K, Cell>> };

export type SheetResult<K extends string> = {
  records: SheetRecord<K>[];
  /** Required columns the sheet does not have. */
  missing: string[];
  /** Header cells that matched no known column; they are ignored. */
  ignored: string[];
};

/**
 * Finds the header row (the first of the first ten rows that names at least two known columns),
 * maps each column by its header, and returns one record per non-empty row below it.
 */
export function toRecords<K extends string>(rows: Cell[][], columns: Column<K>[]): SheetResult<K> {
  const lookup = new Map<string, K>();
  for (const column of columns) for (const alias of [column.label, ...column.aliases]) lookup.set(normalizeHeader(alias), column.key);

  const headerIndex = rows.slice(0, 10).findIndex((row) => row.filter((cell) => lookup.has(normalizeHeader(cell))).length >= 2);
  if (headerIndex < 0) return { records: [], missing: columns.filter((column) => column.required).map((column) => column.label), ignored: [] };

  const header = rows[headerIndex];
  const positions = new Map<K, number>();
  const ignored: string[] = [];
  header.forEach((cell, index) => {
    const key = lookup.get(normalizeHeader(cell));
    if (key && !positions.has(key)) positions.set(key, index);
    else if (String(cell ?? "").trim()) ignored.push(String(cell).trim());
  });

  const records = rows
    .slice(headerIndex + 1)
    .map((row, offset) => {
      const values: Partial<Record<K, Cell>> = {};
      for (const [key, index] of positions) values[key] = row[index] ?? null;
      return { line: headerIndex + offset + 2, values };
    })
    .filter((record) => Object.values(record.values).some((value) => value !== null && String(value).trim() !== ""));

  return {
    records,
    missing: columns.filter((column) => column.required && !positions.has(column.key)).map((column) => column.label),
    ignored,
  };
}

export function cellText(value: Cell | undefined) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

/** "1,500", "1.500 kg", 1500 → 1500; NaN when there is no number. */
export function cellNumber(value: Cell | undefined) {
  if (typeof value === "number") return value;
  const text = cellText(value).replace(/\s|kg/gi, "");
  if (!text) return Number.NaN;
  // Thousands separators: "1,500" or "1.500" (three digits after the mark).
  const plain = /^\d{1,3}([.,]\d{3})+$/.test(text) ? text.replace(/[.,]/g, "") : text.replace(",", ".");
  return Number(plain);
}

const DAY_MS = 86_400_000;

/**
 * A date cell as a day offset from today: Excel dates, Excel serial numbers, "2026-10-20",
 * "20/10/2026" or "20-10-2026" (day first, as written in Vietnam). NaN when it is not a date.
 */
export function cellDayOffset(value: Cell | undefined) {
  let date: Date | null = null;
  if (value instanceof Date) date = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  else if (typeof value === "number" && value > 20000 && value < 80000) {
    // Excel serial date: days since 1899-12-30.
    const utc = new Date(Date.UTC(1899, 11, 30) + value * DAY_MS);
    date = new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
  } else {
    const text = cellText(value);
    const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    const dayFirst = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (iso) date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    else if (dayFirst) date = new Date(Number(dayFirst[3]), Number(dayFirst[2]) - 1, Number(dayFirst[1]));
  }
  if (!date || Number.isNaN(date.getTime())) return Number.NaN;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / DAY_MS);
}

/** "YYYY-MM-DD" for a day offset from today, for sample files. */
export function isoDay(offset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Downloads a CSV (with a BOM so Excel reads Vietnamese text correctly). */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const text = String(value);
    return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const blob = new Blob(["\uFEFF" + rows.map((row) => row.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Vietnamese (and common English) names for the products on Farmora, keyed by normalizeHeader. */
const PRODUCT_NAMES: Record<string, string> = {
  thanhlong: "Dragon fruit",
  dragonfruit: "Dragon fruit",
  pitaya: "Dragon fruit",
  xoai: "Mango",
  mango: "Mango",
  buoi: "Pomelo",
  pomelo: "Pomelo",
  bo: "Avocado",
  avocado: "Avocado",
  saurieng: "Durian",
  durian: "Durian",
  chomchom: "Rambutan",
  rambutan: "Rambutan",
  nhan: "Longan",
  longan: "Longan",
  vaithieu: "Lychee",
  vai: "Lychee",
  lychee: "Lychee",
  mangcut: "Mangosteen",
  mangosteen: "Mangosteen",
  chuoi: "Banana",
  banana: "Banana",
  dua: "Pineapple",
  thom: "Pineapple",
  pineapple: "Pineapple",
};

/**
 * The product name Farmora uses for what a sheet says: "Thanh long" → "Dragon fruit",
 * "mango" → "Mango" (a known product in another case), anything else as typed, capitalised.
 */
export function productName(typed: string, known: string[]) {
  const clean = typed.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const typedKey = normalizeHeader(clean);
  // The catalog the admin manages first (English and Vietnamese names), then the built-in names.
  const fromCatalog = getSite().products.find((product) => normalizeHeader(product.name) === typedKey || (product.nameVi && normalizeHeader(product.nameVi) === typedKey));
  if (fromCatalog) return fromCatalog.name;
  const byName = PRODUCT_NAMES[typedKey];
  if (byName) return byName;
  return known.find((item) => item.toLowerCase() === clean.toLowerCase()) ?? clean.charAt(0).toUpperCase() + clean.slice(1);
}
