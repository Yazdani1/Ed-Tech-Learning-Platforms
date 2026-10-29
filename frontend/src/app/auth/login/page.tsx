import { LoginForm } from '@/components/auth/LoginForm';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign in' };

const LoginPage = () => <LoginForm />;

export default LoginPage;
