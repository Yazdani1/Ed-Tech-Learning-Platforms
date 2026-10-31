// Global component-test setup: jest-dom matchers, MSW API mocks, next/navigation stand-in, English texts.
import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import i18n from '@/i18n/i18n';

import { server } from './msw/server';
import { resetNavigation } from './next-navigation';

vi.mock('next/navigation', async () => (await import('./next-navigation')).nextNavigationMock);
vi.mock('@/components/common/rich-text/LazyRichTextEditor', async () => ({
  LazyRichTextEditor: (await import('./fake-rich-text')).FakeRichTextEditor,
}));

// MUI + i18next make the first render of a file slow (much slower in Docker on Windows): findBy* waits up to 10 s
configure({ asyncUtilTimeout: 10_000 });

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
