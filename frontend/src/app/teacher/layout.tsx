import { AppShell } from '@/components/layout/AppShell';
import { TEACHER_NAV } from '@/components/layout/nav-items';
import { RequireRole } from '@/components/permissions/RequireRole';
import { TEACHER_ROLES } from '@/utils/roles';

import type { FC, ReactNode } from 'react';

interface TeacherLayoutProps {
  children: ReactNode;
}

/** /teacher/*: teachers only. */
const TeacherLayout: FC<TeacherLayoutProps> = ({ children }) => (
  <RequireRole roles={TEACHER_ROLES}>
    <AppShell navItems={TEACHER_NAV}>{children}</AppShell>
  </RequireRole>
);

export default TeacherLayout;
