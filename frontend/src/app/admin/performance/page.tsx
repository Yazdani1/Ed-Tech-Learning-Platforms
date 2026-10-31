import { Suspense } from 'react';

import { FullPageLoader } from '@/components/common/FullPageLoader';
import { PerformancePage } from '@/components/insights/performance/PerformancePage';
import { RequireRole } from '@/components/permissions/RequireRole';
import { SUPER_ADMIN_ROLES } from '@/utils/roles';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Performance' };

/** Super Admin only (others go to the course list, as in the old client). Suspense: choices live in the URL. */
const AdminPerformancePage = () => (
  <RequireRole roles={SUPER_ADMIN_ROLES} fallbackPath="/admin/courses">
    <Suspense fallback={<FullPageLoader />}>
      <PerformancePage />
    </Suspense>
  </RequireRole>
);

export default AdminPerformancePage;
