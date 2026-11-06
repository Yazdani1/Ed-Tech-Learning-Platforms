import { vi } from 'vitest';

export const DESKTOP_WIDTH = 1280;
export const PHONE_WIDTH = 360;

/** Pretends the window is this wide: min-width media queries match accordingly (md breakpoint = 900 px). */
export const setViewportWidth = (width: number): void => {
  vi.stubGlobal('matchMedia', (query: string): MediaQueryList => {
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    return {
      matches: min ? width >= Number(min[1]) : false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    };
  });
};
