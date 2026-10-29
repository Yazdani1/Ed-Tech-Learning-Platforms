import { RequireRole } from '@/components/permissions/RequireRole';
import { STUDENT_ROLES } from '@/utils/roles';

import type { FC, ReactNode } from 'react';

interface StudentLayoutProps {
  children: ReactNode;
}

/** /student/*: students only. Pages with the sidebar live in the (shell) group; the course player does not. */
const StudentLayout: FC<StudentLayoutProps> = ({ children }) => (
  <RequireRole roles={STUDENT_ROLES}>{children}</RequireRole>
);

export default StudentLayout;
