import type { UserRole } from '@/types';

export const ADMIN_AREA_ROLES: readonly UserRole[] = ['Super Admin', 'Admin', 'Moderator'];
export const MANAGER_ROLES: readonly UserRole[] = ['Super Admin', 'Admin'];
export const SUPER_ADMIN_ROLES: readonly UserRole[] = ['Super Admin'];
export const STUDENT_ROLES: readonly UserRole[] = ['Student'];
export const TEACHER_ROLES: readonly UserRole[] = ['Teacher'];

/** Where each role lands after signing in (same as the old client). */
export const ROLE_HOME: Record<UserRole, string> = {
  'Super Admin': '/admin/dashboard',
  Admin: '/admin/courses',
  Moderator: '/admin/courses',
  Teacher: '/teacher/courses',
  Student: '/student/dashboard',
};

/** True when the role is one of the allowed roles (same rule as the backend's authorize()). */
export const hasRole = (role: UserRole | undefined, roles: readonly UserRole[]): boolean =>
  role !== undefined && roles.includes(role);

const AREA_ROLES: [prefix: string, roles: readonly UserRole[]][] = [
  ['/admin', ADMIN_AREA_ROLES],
  ['/student', STUDENT_ROLES],
  ['/teacher', TEACHER_ROLES],
];

/** True when this role may open the page's area (public pages: everyone; /auth: nobody signed in). */
export const canOpenPath = (role: UserRole, path: string): boolean => {
  if (path === '/auth' || path.startsWith('/auth/')) return false;
  const area = AREA_ROLES.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`));
  return area ? area[1].includes(role) : true;
};
