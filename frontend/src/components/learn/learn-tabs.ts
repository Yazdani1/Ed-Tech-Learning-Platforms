import type { LearnPermissions } from './useLearnPermissions';

/** The player's sections, in menu order (the URL's ?tab= value). */
export const LEARN_TABS = [
  'overview',
  'lectures',
  'live',
  'teacher',
  'announcements',
  'materials',
  'students',
  'qa',
  'quiz',
] as const;
export type LearnTab = (typeof LEARN_TABS)[number];

export const DEFAULT_TAB: LearnTab = 'lectures';

/** Which area opened the player: decides the back link. */
export type LearnArea = 'student' | 'teacher' | 'admin';

export const AREA_COURSES_PATH: Record<LearnArea, string> = {
  student: '/student/courses',
  teacher: '/teacher/courses',
  admin: '/admin/courses',
};

export const isLearnTab = (value: string | null): value is LearnTab =>
  value !== null && (LEARN_TABS as readonly string[]).includes(value);

/** The tabs this user sees (the student list is for staff and teachers only). */
export const visibleTabs = (permissions: LearnPermissions): LearnTab[] =>
  LEARN_TABS.filter((tab) => tab !== 'students' || permissions.canSeeStudents);
