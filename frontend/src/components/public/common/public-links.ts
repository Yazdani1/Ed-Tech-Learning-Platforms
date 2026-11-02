/** A link of the public navbar or footer: where it goes and the i18n key of its label. */
import type { SitePageKey } from '@/schemas/site-settings.schema';

export interface PublicLink {
  href: string;
  labelKey: string;
  /** The Site Pages switch that shows or hides this page */
  pageKey: SitePageKey;
}

/** Every public route, in the order of the old navbar. */
export const PUBLIC_NAV_LINKS: readonly PublicLink[] = [
  { href: '/courses', labelKey: 'public.nav.allCourses', pageKey: 'courses' },
  { href: '/free-courses', labelKey: 'public.nav.freeCourses', pageKey: 'free-courses' },
  { href: '/pricing', labelKey: 'public.nav.pricing', pageKey: 'pricing' },
  { href: '/teachers', labelKey: 'public.nav.teachers', pageKey: 'teachers' },
  { href: '/practice-quiz', labelKey: 'public.nav.practiceQuiz', pageKey: 'practice-quiz' },
  { href: '/community-hub', labelKey: 'public.nav.communityHub', pageKey: 'community-hub' },
];

export const FOOTER_LINKS: readonly PublicLink[] = [
  { href: '/courses', labelKey: 'public.footer.courses', pageKey: 'courses' },
  { href: '/free-courses', labelKey: 'public.footer.freeCourses', pageKey: 'free-courses' },
  { href: '/teachers', labelKey: 'public.footer.teachers', pageKey: 'teachers' },
  { href: '/pricing', labelKey: 'public.footer.pricing', pageKey: 'pricing' },
];

/** The catalog address for a search text or a category / course type filter (the backend's own names). */
export const coursesHref = (filter: {
  search?: string;
  categories?: string;
  courseTypes?: string;
}) => {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `/courses?${query}` : '/courses';
};
