import { AppShell } from '@/components/layout/AppShell';
import { ADMIN_NAV } from '@/components/layout/nav-items';
import { RequireRole } from '@/components/permissions/RequireRole';
import { ADMIN_AREA_ROLES } from '@/utils/roles';

import type { FC, ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

/** /admin/*: Super Admin, Admin and Moderator (narrower pages add their own RequireRole). */
const AdminLayout: FC<AdminLayoutProps> = ({ children }) => (
  <RequireRole roles={ADMIN_AREA_ROLES}>
    <AppShell navItems={ADMIN_NAV}>{children}</AppShell>
  </RequireRole>
);

export default AdminLayout;
