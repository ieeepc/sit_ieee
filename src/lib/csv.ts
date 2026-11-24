// Builds a CSV from rows (first row = header) and triggers a browser download.
export function downloadCsv(fileName: string, rows: string[][]) {
  // Prefix cells that spreadsheet apps would treat as formulas so user-entered
  // text (team names, etc.) can't execute when the CSV is opened.
  const escape = (v: string) => {
    const guarded = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return `"${guarded.replace(/"/g, '""')}"`;
  };
  const blob = new Blob([rows.map((r) => r.map(escape).join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}
