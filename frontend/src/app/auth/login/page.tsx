import { redirect } from 'next/navigation';

import { withAuthPanel } from '@/utils/auth-drawer';

interface LoginRedirectProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

/** Old address: sign-in and create account are a panel now; opens it on the home page (keeps a safe ?next=). */
const LoginRedirect = async ({ searchParams }: LoginRedirectProps) => {
  const { next } = await searchParams;
  redirect(withAuthPanel('/', '', 'login', typeof next === 'string' ? next : null));
};

export default LoginRedirect;
