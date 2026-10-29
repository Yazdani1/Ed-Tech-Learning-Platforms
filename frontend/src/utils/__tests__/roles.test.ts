import { describe, expect, it } from 'vitest';

import { ADMIN_AREA_ROLES, canOpenPath, hasRole, MANAGER_ROLES } from '../roles';

describe('hasRole', () => {
  it('is true only for one of the allowed roles', () => {
    expect(hasRole('Moderator', ADMIN_AREA_ROLES)).toBe(true);
    expect(hasRole('Moderator', MANAGER_ROLES)).toBe(false);
  });

  it('is false when nobody is signed in', () => {
    expect(hasRole(undefined, ADMIN_AREA_ROLES)).toBe(false);
  });
});

describe('canOpenPath', () => {
  it.each([
    ['Super Admin', '/admin/dashboard', true],
    ['Moderator', '/admin', true],
    ['Teacher', '/admin/courses', false],
    ['Student', '/student/courses', true],
    ['Admin', '/student/dashboard', false],
    ['Teacher', '/teacher/courses', true],
    ['Student', '/teacher', false],
    ['Student', '/courses/123', true],
    ['Admin', '/auth/login', false],
  ] as const)('%s may open %s: %s', (role, path, expected) => {
    expect(canOpenPath(role, path)).toBe(expected);
  });

  it('matches whole folder names only (/administrator is not /admin)', () => {
    expect(canOpenPath('Student', '/administrator')).toBe(true);
  });
});
