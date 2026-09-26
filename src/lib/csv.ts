/** Download rows as a CSV file named `filename`. Column order follows the first row. */
export function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Flatten a record into CSV cells: primitives as-is, lists joined, nested objects skipped. */
export function toCsvRow(record: object): Record<string, string | number> {
  const row: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string" || typeof value === "number") row[key] = value;
    else if (typeof value === "boolean") row[key] = value ? "Yes" : "No";
    else if (Array.isArray(value) && value.every((v) => typeof v !== "object")) row[key] = value.join("; ");
  }
  return row;
}
