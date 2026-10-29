// Runs once before the E2E suite. The stack serves pages with `next dev`, which compiles each route on its
// first visit; several workers hitting cold routes at once can make an API call outlast the app's request
// timeout. Opening every route once here compiles them before any test starts.
const ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/admin/dashboard',
  '/admin/courses',
  '/student/dashboard',
  '/teacher/courses',
  '/this-page-does-not-exist',
];
const WARM_UP_TIMEOUT_MS = 180_000;

const globalSetup = async (): Promise<void> => {
  const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';
  for (const route of ROUTES) {
    // A cookie makes proxy.ts let the signed-in areas render (their page code is what needs compiling)
    await fetch(`${baseURL}${route}`, {
      headers: { cookie: 'token=warm-up' },
      redirect: 'manual',
      signal: AbortSignal.timeout(WARM_UP_TIMEOUT_MS),
    });
  }
};

export default globalSetup;
