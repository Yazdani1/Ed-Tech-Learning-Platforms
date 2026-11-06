import { redirect } from 'next/navigation';

import { withAuthPanel } from '@/utils/auth-drawer';

interface RegisterRedirectProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

/** Old address: sign-in and create account are a panel now; opens it on the home page (keeps a safe ?next=). */
const RegisterRedirect = async ({ searchParams }: RegisterRedirectProps) => {
  const { next } = await searchParams;
  redirect(withAuthPanel('/', '', 'register', typeof next === 'string' ? next : null));
};

export default RegisterRedirect;
