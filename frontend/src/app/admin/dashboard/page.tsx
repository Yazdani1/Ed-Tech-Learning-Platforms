import { MigratingPage } from '@/components/common/MigratingPage';
import { RequireRole } from '@/components/permissions/RequireRole';
import { SUPER_ADMIN_ROLES } from '@/utils/roles';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

/** Super Admin only; Admins and Moderators go to the course list (as in the old client). */
const AdminDashboardPage = () => (
  <RequireRole roles={SUPER_ADMIN_ROLES} fallbackPath="/admin/courses">
    <MigratingPage titleKey="nav.dashboard" />
  </RequireRole>
);

export default AdminDashboardPage;
