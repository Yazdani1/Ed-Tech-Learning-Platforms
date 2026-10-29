import { AppShell } from '@/components/layout/AppShell';
import { STUDENT_NAV } from '@/components/layout/nav-items';

import type { FC, ReactNode } from 'react';

interface StudentShellLayoutProps {
  children: ReactNode;
}

const StudentShellLayout: FC<StudentShellLayoutProps> = ({ children }) => (
  <AppShell navItems={STUDENT_NAV}>{children}</AppShell>
);

export default StudentShellLayout;
