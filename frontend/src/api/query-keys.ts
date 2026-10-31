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
  },
  /** Course player (learn*.api.ts) */
  learn: {
    all: ['learn'] as const,
    announcements: (courseId: string) => ['learn', 'announcements', courseId] as const,
    materials: (courseId: string) => ['learn', 'materials', courseId] as const,
    enrollmentCount: (courseId: string) => ['learn', 'enrollment-count', courseId] as const,
    questions: (courseId: string) => ['learn', 'questions', courseId] as const,
    question: (questionId: string) => ['learn', 'question', questionId] as const,
    quizAttempts: (courseId: string) => ['learn', 'quiz-attempts', courseId] as const,
  },
  showcase: {
    posts: ['showcase', 'posts'] as const,
    logo: ['showcase', 'logo'] as const,
  },
  /** People administration (people.api.ts): users, teacher profiles, subscriptions, staff Q&A. */
  people: {
    users: ['people', 'users'] as const,
    userList: (params: Record<string, string | number>) => ['people', 'users', params] as const,
    subscriptions: ['people', 'subscriptions'] as const,
    subscriptionList: (params: Record<string, string | number>) =>
      ['people', 'subscriptions', params] as const,
    qaGroups: ['people', 'qa', 'groups'] as const,
  },
  adminCourses: {
    all: ['admin-courses'] as const,
    list: (params: Record<string, string>) => ['admin-courses', 'list', params] as const,
    enrollmentStats: (courseId: string) => ['admin-courses', 'enrollment-stats', courseId] as const,
    enrollments: (courseId: string, type: string) =>
      ['admin-courses', 'enrollments', courseId, type] as const,
  },
  /** Quiz sections and banks of a course (quiz.api.ts), shared by the course editor and the player */
  quiz: {
    sections: (courseId: string) => ['quiz', 'sections', courseId] as const,
    banks: (courseId: string) => ['quiz', 'banks', courseId] as const,
  },
  /** Enrolled students of a course (enrollment.api.ts), shared by admin, player and teacher screens */
  enrollments: {
    students: (courseId: string) => ['enrollments', 'students', courseId] as const,
  },
  /** Teacher area (teacher.api.ts) */
  teacher: {
    myCourses: ['teacher', 'my-courses'] as const,
  },
  /** Super Admin dashboard and performance reports (insights.api.ts) */
  insights: {
    all: ['insights'] as const,
    dashboard: ['insights', 'dashboard'] as const,
    performanceCourses: ['insights', 'performance-courses'] as const,
    performance: (courseId: string, dateRange: string) =>
      ['insights', 'performance', courseId, dateRange] as const,
  },
};
