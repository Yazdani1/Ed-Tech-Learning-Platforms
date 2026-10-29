import { AuthLayout } from '@/components/auth/AuthLayout';

import type { FC, ReactNode } from 'react';

interface AuthRouteLayoutProps {
  children: ReactNode;
}

const AuthRouteLayout: FC<AuthRouteLayoutProps> = ({ children }) => (
  <AuthLayout>{children}</AuthLayout>
);

export default AuthRouteLayout;
