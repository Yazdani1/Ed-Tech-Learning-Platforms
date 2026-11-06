// A print-out made by the browser (it shapes Bangla and every other script correctly): a new tab with a plain
// table, then the print dialog, where "Save as PDF" gives the file. Built with DOM calls only (no inline
// scripts, so the site's Content-Security-Policy applies unchanged).

export interface PrintTable {
  title: string;
  subtitle: string;
  headers: readonly string[];
  rows: readonly (readonly string[])[];
}

const PAGE_STYLE =
  'font-family: system-ui, "Noto Sans Bengali", sans-serif; margin: 24px; color: #111827;';
const TABLE_STYLE = 'border-collapse: collapse; width: 100%; font-size: 12px;';
const CELL_STYLE = 'border: 1px solid #d1d5db; padding: 6px 8px; text-align: left;';
const HEAD_STYLE = `${CELL_STYLE} background: #2563eb; color: #ffffff;`;

/**
 * Opens the print tab at once (inside the click, so pop-up blockers allow it); returns null when the browser
 * blocked it anyway.
 */
export const openPrintWindow = (loadingText: string): Window | null => {
  const win = window.open('', '_blank');
  if (!win) return null;
  win.document.title = loadingText;
  win.document.body.textContent = loadingText;
  return win;
};

const cell = (doc: Document, tag: 'td' | 'th', text: string): HTMLElement => {
  const element = doc.createElement(tag);
  element.setAttribute('style', tag === 'th' ? HEAD_STYLE : CELL_STYLE);
  element.textContent = text;
  return element;
};

/** Fills the tab with the title, a line under it and the table, then opens the print dialog. */
export const printTable = (win: Window, table: PrintTable): void => {
  const doc = win.document;
  doc.title = table.title;
  doc.documentElement.lang = navigator.language;
  doc.body.replaceChildren();
  doc.body.setAttribute('style', PAGE_STYLE);
  const heading = doc.createElement('h1');
  heading.setAttribute('style', 'font-size: 18px; margin: 0 0 4px;');
  heading.textContent = table.title;
  const subtitle = doc.createElement('p');
  subtitle.setAttribute('style', 'margin: 0 0 16px; color: #4b5563; font-size: 12px;');
  subtitle.textContent = table.subtitle;
  const element = doc.createElement('table');
  element.setAttribute('style', TABLE_STYLE);
  const headRow = doc.createElement('tr');
  table.headers.forEach((header) => headRow.appendChild(cell(doc, 'th', header)));
  const head = doc.createElement('thead');
  head.appendChild(headRow);
  const body = doc.createElement('tbody');
  table.rows.forEach((row) => {
    const line = doc.createElement('tr');
    row.forEach((value) => line.appendChild(cell(doc, 'td', value)));
    body.appendChild(line);
  });
  element.append(head, body);
  doc.body.append(heading, subtitle, element);
  win.focus();
  win.print();
};
