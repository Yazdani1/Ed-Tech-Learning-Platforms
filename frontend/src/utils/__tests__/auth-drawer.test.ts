import { describe, expect, it } from 'vitest';

import { isAuthMode, signInRedirect, withAuthPanel, withoutAuthPanel } from '../auth-drawer';

describe('isAuthMode', () => {
  it('accepts only login and register', () => {
    expect(isAuthMode('login')).toBe(true);
    expect(isAuthMode('register')).toBe(true);
    expect(isAuthMode('admin')).toBe(false);
    expect(isAuthMode(null)).toBe(false);
  });
});

describe('withAuthPanel', () => {
  it('opens the panel on the same page and keeps the other query parameters', () => {
    expect(withAuthPanel('/courses', '?search=react', 'login')).toBe(
      '/courses?search=react&auth=login',
    );
  });

  it('adds a safe next page, encoded', () => {
    expect(withAuthPanel('/', '', 'register', '/courses/1/payment?x=1')).toBe(
      '/?auth=register&next=%2Fcourses%2F1%2Fpayment%3Fx%3D1',
    );
  });

  it.each(['https://evil.example', '//evil.example', '/\\evil.example', '/\t/evil.example'])(
    'drops the unsafe next "%s"',
    (next) => {
      expect(withAuthPanel('/', '?next=/admin', 'login', next)).toBe('/?auth=login');
    },
  );

  it('replaces an earlier panel mode and next page', () => {
    expect(
      withAuthPanel('/', '?auth=login&next=%2Fstudent%2Fcourses', 'register', '/pricing'),
    ).toBe('/?auth=register&next=%2Fpricing');
  });
});

describe('withoutAuthPanel', () => {
  it('removes the panel parameters and keeps the rest', () => {
    expect(withoutAuthPanel('/courses', 'auth=login&next=%2Fpricing&search=a')).toBe(
      '/courses?search=a',
    );
    expect(withoutAuthPanel('/', 'auth=register')).toBe('/');
  });
});

describe('signInRedirect', () => {
  it('sends a signed-out visitor to the home page with the panel and the way back', () => {
    expect(signInRedirect('/admin/courses?page=3')).toBe(
      '/?auth=login&next=%2Fadmin%2Fcourses%3Fpage%3D3',
    );
    expect(signInRedirect()).toBe('/?auth=login');
    expect(signInRedirect('https://evil.example')).toBe('/?auth=login');
  });
});
