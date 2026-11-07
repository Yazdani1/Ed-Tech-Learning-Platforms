// A print-out of cards in a grid, 3 per row with space and dashed cut lines (student tokens for a draw: print,
// cut, fold). Same approach as print-table: a new tab built with DOM calls, then the print dialog ("Save as PDF").

export interface PrintGrid {
  title: string;
  subtitle: string;
  /** One card per entry; each card shows its lines (the first one larger) */
  cards: readonly (readonly string[])[];
}

const COLUMNS = 3;
const PAGE_STYLE =
  'font-family: system-ui, "Noto Sans Bengali", sans-serif; margin: 16px; color: #111827;';
const GRID_STYLE = `display: grid; grid-template-columns: repeat(${String(COLUMNS)}, 1fr); gap: 18px;`;
const CARD_STYLE =
  'border: 1.5px dashed #6b7280; border-radius: 6px; padding: 18px 12px; min-height: 90px; display: flex; ' +
  'flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 4px; ' +
  'break-inside: avoid; page-break-inside: avoid;';
const FIRST_LINE_STYLE = 'font-size: 15px; font-weight: 700; margin: 0; word-break: break-word;';
const LINE_STYLE = 'font-size: 12px; margin: 0; color: #374151; word-break: break-word;';

/** Fills the tab with the title and the card grid, then opens the print dialog. */
export const printGrid = (win: Window, grid: PrintGrid): void => {
  const doc = win.document;
  doc.title = grid.title;
  doc.documentElement.lang = navigator.language;
  doc.body.replaceChildren();
  doc.body.setAttribute('style', PAGE_STYLE);
  const heading = doc.createElement('h1');
  heading.setAttribute('style', 'font-size: 16px; margin: 0 0 4px;');
  heading.textContent = grid.title;
  const subtitle = doc.createElement('p');
  subtitle.setAttribute('style', 'margin: 0 0 14px; color: #4b5563; font-size: 11px;');
  subtitle.textContent = grid.subtitle;
  const container = doc.createElement('div');
  container.setAttribute('style', GRID_STYLE);
  grid.cards.forEach((lines) => {
    const card = doc.createElement('div');
    card.setAttribute('style', CARD_STYLE);
    lines.forEach((text, index) => {
      const line = doc.createElement('p');
      line.setAttribute('style', index === 0 ? FIRST_LINE_STYLE : LINE_STYLE);
      line.textContent = text;
      card.appendChild(line);
    });
    container.appendChild(card);
  });
  doc.body.append(heading, subtitle, container);
  win.focus();
  win.print();
};
