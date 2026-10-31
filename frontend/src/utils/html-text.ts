// Rich text (HTML from the TipTap editor) as plain text. Results are rendered by React as text, never as HTML,
// so leftover markup can never run.

const TAGS = /<[^>]*>/g;
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};
const ENTITY = /&(amp|lt|gt|quot|#39|nbsp);/g;

/** Plain text of rich text for short previews (cards, rows, popovers). */
export const htmlToPlainText = (html: string | null | undefined): string =>
  (html ?? '')
    .replace(TAGS, ' ')
    .replace(ENTITY, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim();

/** Rich text counts as empty when it has no visible text (e.g. "<p></p>" or "<p>&nbsp;</p>"). */
export const hasVisibleText = (html: string): boolean => htmlToPlainText(html) !== '';
