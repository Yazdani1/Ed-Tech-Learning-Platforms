// Stand-in for next/navigation in component tests (there is no Next.js router in jsdom).
// setup.ts mocks the module with these; tests set the current page and read the router calls.
import { vi } from 'vitest';

export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

const location = { pathname: '/', search: '' };

/** Sets what usePathname/useSearchParams return for the next render. */
export const setLocation = (pathname: string, search = ''): void => {
  location.pathname = pathname;
  location.search = search;
};

export const resetNavigation = (): void => {
  Object.values(router).forEach((fn) => fn.mockReset());
  setLocation('/');
};

export const nextNavigationMock = {
  useRouter: () => router,
  usePathname: () => location.pathname,
  useSearchParams: () => new URLSearchParams(location.search),
};
