/** A link of the public navbar or footer: where it goes and the i18n key of its label. */
export interface PublicLink {
  href: string;
  labelKey: string;
}

/** Every public route, in the order of the old navbar. */
export const PUBLIC_NAV_LINKS: readonly PublicLink[] = [
  { href: '/courses', labelKey: 'public.nav.allCourses' },
  { href: '/free-courses', labelKey: 'public.nav.freeCourses' },
  { href: '/pricing', labelKey: 'public.nav.pricing' },
  { href: '/teachers', labelKey: 'public.nav.teachers' },
  { href: '/practice-quiz', labelKey: 'public.nav.practiceQuiz' },
  { href: '/community-hub', labelKey: 'public.nav.communityHub' },
];

export const FOOTER_LINKS: readonly PublicLink[] = [
  { href: '/courses', labelKey: 'public.footer.courses' },
  { href: '/free-courses', labelKey: 'public.footer.freeCourses' },
  { href: '/teachers', labelKey: 'public.footer.teachers' },
  { href: '/pricing', labelKey: 'public.footer.pricing' },
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
