import { describe, expect, it } from 'vitest';

import { hasVisibleText, htmlToPlainText } from '../html-text';

describe('htmlToPlainText', () => {
  it('strips tags, decodes entities and collapses spaces', () => {
    expect(htmlToPlainText('<p>Hello&nbsp;<b>world</b></p><p>a &amp; b</p>')).toBe(
      'Hello world a & b',
    );
  });

  it('keeps escaped markup as text and accepts null', () => {
    expect(htmlToPlainText('<p>&lt;script&gt;</p>')).toBe('<script>');
    expect(htmlToPlainText(null)).toBe('');
  });
});

describe('hasVisibleText', () => {
  it('treats editor HTML without text as empty', () => {
    expect(hasVisibleText('<p></p>')).toBe(false);
    expect(hasVisibleText('<p>&nbsp;</p>')).toBe(false);
    expect(hasVisibleText('<p>Hi</p>')).toBe(true);
  });
});
