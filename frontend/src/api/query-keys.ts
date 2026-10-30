/** Every TanStack Query key in one place, so invalidation never misses a spelling. */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  /** Shared catalog reads (catalog.api.ts): one key per endpoint, used by every screen. */
  catalog: {
    all: ['catalog'] as const,
    categories: ['catalog', 'categories'] as const,
    courseTypes: ['catalog', 'course-types'] as const,
    plans: ['catalog', 'subscription-plans'] as const,
    myEnrollments: ['catalog', 'my-enrollments'] as const,
    mySubscription: ['catalog', 'my-subscription'] as const,
  },
  public: {
    all: ['public'] as const,
    siteLogo: ['public', 'site-logo'] as const,
    heroPosts: ['public', 'hero-posts'] as const,
    activeDiscount: ['public', 'active-discount'] as const,
    teachers: ['public', 'teachers'] as const,
    homeCourses: (page: number) => ['public', 'home-courses', page] as const,
    planCourses: (plan: string, filters: Record<string, string>) =>
      ['public', 'plan-courses', plan, filters] as const,
  },
  browse: {
    all: ['browse'] as const,
    courses: (params: Record<string, string | number>) => ['browse', 'courses', params] as const,
    freeCourses: ['browse', 'free-courses'] as const,
    course: (id: string) => ['browse', 'course', id] as const,
    liveClasses: (id: string) => ['browse', 'live-classes', id] as const,
    quizTree: (id: string) => ['browse', 'quiz-tree', id] as const,
    enrollment: (id: string) => ['browse', 'enrollment', id] as const,
  },
  profile: {
    me: ['profile', 'me'] as const,
    teacherCourses: ['profile', 'teacher-courses'] as const,
  },
  showcase: {
    posts: ['showcase', 'posts'] as const,
    logo: ['showcase', 'logo'] as const,
  },
};
