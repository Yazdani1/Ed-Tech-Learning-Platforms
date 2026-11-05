import { describe, expect, it } from 'vitest';

import { isCloudinaryUrl, isSafeHttpUrl, mailtoHref } from '../urls';

describe('url guards', () => {
  it('builds a mailto link without hidden parameters', () => {
    expect(mailtoHref('help@example.com')).toBe('mailto:help@example.com');
    expect(mailtoHref('help@example.com?bcc=x%40y.z')).toBe(
      'mailto:help@example.com%3Fbcc=x%40y.z',
    );
  });

  it('accepts only https Cloudinary images', () => {
    expect(isCloudinaryUrl('https://res.cloudinary.com/demo/a.png')).toBe(true);
    expect(isCloudinaryUrl('https://evil.example/a.png')).toBe(false);
    expect(isCloudinaryUrl('http://res.cloudinary.com/a.png')).toBe(false);
    expect(isCloudinaryUrl('https://res.cloudinary.com.evil.example/a.png')).toBe(false);
    expect(isCloudinaryUrl(null)).toBe(false);
  });

  it('accepts only http(s) links', () => {
    expect(isSafeHttpUrl('https://example.com')).toBe(true);
    expect(isSafeHttpUrl('http://example.com')).toBe(true);
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeHttpUrl('not a url')).toBe(false);
  });
});
