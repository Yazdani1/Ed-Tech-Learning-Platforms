import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SafeHtml } from '../SafeHtml';

/** The sanitised markup SafeHtml put on the page (it appears once the component knows it is in a browser). */
const renderHtml = async (html: string): Promise<HTMLElement> => {
  const { container } = render(<SafeHtml html={html} />);
  const inner = container.firstElementChild?.firstElementChild;
  if (!(inner instanceof HTMLElement)) throw new Error('SafeHtml did not render its content box');
  await waitFor(() => {
    expect(inner.innerHTML).not.toBe('');
  });
  return inner;
};

describe('SafeHtml', () => {
  it('keeps formatting and drops scripts and event handlers', async () => {
    const box = await renderHtml(
      '<p>Hello <strong>world</strong></p><script>alert(1)</script><img src="x" onerror="alert(2)">',
    );

    expect(screen.getByText('world').tagName).toBe('STRONG');
    expect(box.querySelector('script')).toBeNull();
    expect(box.querySelector('img')).toBeNull();
    expect(box.innerHTML).not.toContain('onerror');
  });

  it('removes javascript: links, iframes and inline styles other than text alignment', async () => {
    const box = await renderHtml(
      '<a href="javascript:alert(1)">bad</a><iframe src="https://evil.example"></iframe>' +
        '<p style="color: red; background: url(https://evil.example/x.png)">styled</p>' +
        '<p style="text-align: center">centred</p><p style="text-align: center; color: red">mixed</p>',
    );

    expect(screen.getByText('bad')).not.toHaveAttribute('href');
    expect(box.querySelector('iframe')).toBeNull();
    expect(screen.getByText('styled')).not.toHaveAttribute('style');
    expect(screen.getByText('centred')).toHaveAttribute('style', 'text-align: center');
    // Only the alignment survives, the rest of the style is dropped
    expect(screen.getByText('mixed')).toHaveAttribute('style', 'text-align: center');
  });

  it('opens http(s) links in a new tab with rel="noopener noreferrer" and ignores the given target', async () => {
    await renderHtml(
      '<a href="https://example.com" target="_self" rel="opener">site</a>' +
        '<a href="mailto:a@example.com" target="_blank">mail</a>',
    );

    const site = screen.getByText('site');
    expect(site).toHaveAttribute('href', 'https://example.com');
    expect(site).toHaveAttribute('target', '_blank');
    expect(site).toHaveAttribute('rel', 'noopener noreferrer');
    const mail = screen.getByText('mail');
    expect(mail).toHaveAttribute('href', 'mailto:a@example.com');
    expect(mail).not.toHaveAttribute('target');
    expect(mail).not.toHaveAttribute('rel');
  });
});
