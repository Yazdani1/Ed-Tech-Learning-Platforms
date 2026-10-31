'use client';

import { RequireRole } from '@/components/permissions/RequireRole';
import { MANAGER_ROLES } from '@/utils/roles';

import { TeachersManager } from './TeachersManager';

/** /admin/teachers: Super Admin and Admin (the backend's write routes allow only them). */
export const TeachersPage = () => (
  <RequireRole roles={MANAGER_ROLES}>
    <TeachersManager />
  </RequireRole>
);
