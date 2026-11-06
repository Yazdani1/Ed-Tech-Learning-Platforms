// Files built in the browser and handed to the viewer (CSV export, PDF print-outs).

/** One CSV cell: quoted when needed; a leading = + - @ is neutralised so spreadsheets never run it as a formula. */
const csvCell = (value: string | number | null | undefined): string => {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Byte order mark: Excel then reads the CSV as UTF-8 */
const BOM = String.fromCharCode(0xfeff);

/** A CSV text (UTF-8 with BOM so Excel shows Bangla names correctly). */
export const toCsv = (
  headers: readonly string[],
  rows: readonly (readonly (string | number | null | undefined)[])[],
): string =>
  `${BOM}${[headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;

/** Saves a Blob as a file with the given name. */
export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const downloadCsv = (csv: string, fileName: string): void => {
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), fileName);
};

/** "orders-2026-11-06.csv" */
export const datedFileName = (prefix: string, extension: string, now = new Date()): string =>
  `${prefix}-${now.toISOString().slice(0, 10)}.${extension}`;
