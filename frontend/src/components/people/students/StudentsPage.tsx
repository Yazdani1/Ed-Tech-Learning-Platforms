'use client';

import { Suspense } from 'react';

import { FullPageLoader } from '@/components/common/FullPageLoader';
import { RequireRole } from '@/components/permissions/RequireRole';
import { MANAGER_ROLES } from '@/utils/roles';

import { StudentsManager } from './StudentsManager';

/** /admin/students: Super Admin and Admin (as the backend allows). Filters live in the URL, so Suspense. */
export const StudentsPage = () => (
  <RequireRole roles={MANAGER_ROLES}>
    <Suspense fallback={<FullPageLoader />}>
      <StudentsManager />
    </Suspense>
  </RequireRole>
);
