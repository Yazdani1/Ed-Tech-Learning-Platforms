'use client';

import { RequireRole } from '@/components/permissions/RequireRole';
import { MANAGER_ROLES } from '@/utils/roles';

import { PromosContent } from './PromosContent';

/** /admin/promos (Super Admin, Admin): promos for chosen paid courses (home banner, pop-up, promo page). */
export const PromosPage = () => (
  <RequireRole roles={MANAGER_ROLES}>
    <PromosContent />
  </RequireRole>
);
