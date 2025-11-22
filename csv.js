// src/utils/csv.js
export function toCSV(rows = [], columns = []) {
  const keys = columns.length ? columns : Object.keys(rows[0] || {});
  const header = keys.join(",");
  const lines = rows.map(r => keys.map(k => {
    let v = r[k] ?? "";
    v = String(v).replace(/"/g, '""');
    if (v.includes(",") || v.includes('"')) v = `"${v}"`;
    return v;
  }).join(","));
  return [header, ...lines].join("\n");
}

export function downloadCSV(content, filename = "export.csv") {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function parseCSVFile(file) {
  const txt = await file.text();
  const lines = txt.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = lines.slice(1).map(l => {
    const cols = l.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    const obj = {};
    headers.forEach((h, i) => obj[h] = cols[i] ?? "");
    return obj;
  });
  return rows;
}
