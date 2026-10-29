// Global component-test setup: jest-dom matchers, MSW API mocks, next/navigation stand-in, English texts.
import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import i18n from '@/i18n/i18n';

import { server } from './msw/server';
import { resetNavigation } from './next-navigation';

vi.mock('next/navigation', async () => (await import('./next-navigation')).nextNavigationMock);

// MUI + i18next make the first render of a file slow; findBy* waits up to 3 s instead of 1 s
configure({ asyncUtilTimeout: 3000 });

// jsdom has no matchMedia (react-hot-toast asks for prefers-reduced-motion): no media query matches
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  });
}

beforeAll(() => {
  // Every request must have a handler: a forgotten mock fails the test instead of hitting the network
  server.listen({ onUnhandledFrame: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetNavigation();
  // A test may change the address bar (RequireRole reads window.location.search); node-env tests have none
  if (typeof window !== 'undefined') window.history.replaceState(null, '', '/');
  void i18n.changeLanguage('en');
});

afterAll(() => {
  server.close();
});
