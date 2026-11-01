import { describe, expect, it } from 'vitest';

import { findImageProblem, IMAGE_MAX_BYTES, isAllowedImageType } from '../image-files';

const file = (name: string, type: string, size = 10): File => {
  const item = new File(['x'], name, { type });
  Object.defineProperty(item, 'size', { value: size });
  return item;
};

describe('image-files', () => {
  it('accepts PNG, JPEG, GIF and WEBP only', () => {
    expect(isAllowedImageType('image/webp')).toBe(true);
    expect(isAllowedImageType('image/svg+xml')).toBe(false);
  });

  it('reports the first problem: type, then size, then count', () => {
    const ok = file('a.png', 'image/png');
    const svg = file('b.svg', 'image/svg+xml');
    const big = file('c.jpg', 'image/jpeg', IMAGE_MAX_BYTES + 1);
    expect(findImageProblem([ok, svg, big])).toEqual({ reason: 'badType', file: svg });
    expect(findImageProblem([ok, big])).toEqual({ reason: 'tooLarge', file: big });
    expect(findImageProblem([ok, ok], 1)).toEqual({ reason: 'tooMany' });
    expect(findImageProblem([ok], 1)).toBeNull();
  });
});
