import DOMPurify from 'dompurify';

// Rich text from the TipTap editor. Only formatting tags survive; scripts, event handlers, iframes, inline
// styles and javascript: links are removed. Browser only (DOMPurify needs a DOM).

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'a',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'blockquote',
  'code',
  'pre',
  'hr',
  'span',
];
/** `style` and `target`/`rel` are never taken from the input: the hooks below set the safe values. */
const ALLOWED_ATTR = ['href'];
const SAFE_URI = /^(?:https?:|mailto:)/i;
const HTTP_LINK = /^https?:\/\//i;
/** The one inline style the editor writes that we keep: paragraph/heading alignment. */
const TEXT_ALIGN = /(?:^|;)\s*text-align\s*:\s*(left|center|right|justify)\s*(?:;|$)/i;

/** Alignment read from each element's style before DOMPurify drops the style attribute. */
const pendingAlign = new WeakMap<Element, string>();
let hooksAdded = false;

/** DOMPurify also runs the attribute hooks on text and comment nodes (despite its types). */
const ELEMENT_NODE = 1;
const isElement = (node: Node): boolean => node.nodeType === ELEMENT_NODE;

const addHooksOnce = (): void => {
  if (hooksAdded) return;
  hooksAdded = true;
  DOMPurify.addHook('beforeSanitizeAttributes', (node) => {
    if (!isElement(node)) return;
    const style = node.getAttribute('style');
    const align = style ? TEXT_ALIGN.exec(style)?.[1] : undefined;
    if (align) pendingAlign.set(node, align.toLowerCase());
  });
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (!isElement(node)) return;
    const align = pendingAlign.get(node);
    if (align) {
      node.setAttribute('style', `text-align: ${align}`);
      pendingAlign.delete(node);
    }
    if (node.tagName === 'A' && HTTP_LINK.test(node.getAttribute('href') ?? '')) {
      // External links open in a new tab without giving the new page access to this one
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
};

/** The sanitised HTML string, safe to inject (call it in the browser only). */
export const sanitizeRichText = (html: string): string => {
  addHooksOnce();
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOWED_URI_REGEXP: SAFE_URI });
};
