import { describe, expect, it } from 'vitest';

import { postLoginPath, safeRedirectPath } from '../safe-redirect';

describe('safeRedirectPath', () => {
  it.each([
    ['/student/courses', '/student/courses'],
    ['/student/courses?page=2#top', '/student/courses?page=2#top'],
    ['/student/../admin/users', '/admin/users'],
  ])('keeps the same-site path %s', (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });

  it.each([
    ['an absolute URL', 'https://evil.example'],
    ['a protocol-relative URL', '//evil.example'],
    ['a backslash', '/\\evil.example'],
    ['a tab (browsers drop it: "/\\t/x" becomes "//x")', '/\t/evil.example'],
    ['a newline', '/\n/evil.example'],
    ['a carriage return', '/\r/evil.example/x'],
    ['a DEL character', '/\u007f/evil.example'],
    ['a relative path', 'evil.example'],
    ['an empty value', ''],
  ])('rejects %s', (_label, input) => {
    expect(safeRedirectPath(input)).toBeNull();
  });

  it('rejects a missing value', () => {
    expect(safeRedirectPath(null)).toBeNull();
  });
});

describe('postLoginPath', () => {
  it('follows ?next= when the role may open that area', () => {
    expect(postLoginPath('Admin', '/admin/users?page=2')).toBe('/admin/users?page=2');
    expect(postLoginPath('Student', '/pricing')).toBe('/pricing');
  });

  it("sends the user to their own home when ?next= is another role's area", () => {
    expect(postLoginPath('Student', '/admin/users')).toBe('/student/dashboard');
    expect(postLoginPath('Teacher', '/student/dashboard')).toBe('/teacher/courses');
  });

  it('checks the area after normalising "..", so traversal cannot sneak into /admin', () => {
    expect(postLoginPath('Student', '/student/../admin/users')).toBe('/student/dashboard');
  });

  it('never returns to the sign-in pages', () => {
    expect(postLoginPath('Moderator', '/auth/register')).toBe('/admin/courses');
  });

  it.each([
    ['Super Admin', '/admin/dashboard'],
    ['Admin', '/admin/courses'],
    ['Moderator', '/admin/courses'],
    ['Teacher', '/teacher/courses'],
    ['Student', '/student/dashboard'],
  ] as const)('sends %s home (%s) when ?next= is unsafe', (role, home) => {
    expect(postLoginPath(role, '/\t/evil.example')).toBe(home);
  });
});
