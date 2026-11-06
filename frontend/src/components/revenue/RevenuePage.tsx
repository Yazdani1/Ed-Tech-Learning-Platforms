'use client';

import { Suspense } from 'react';

import { FullPageLoader } from '@/components/common/FullPageLoader';
import { RequireRole } from '@/components/permissions/RequireRole';
import { MANAGER_ROLES } from '@/utils/roles';

import { RevenueContent } from './RevenueContent';

/** /admin/revenue (Super Admin, Admin): sales cards and chart, every order with filters, CSV and PDF. */
export const RevenuePage = () => (
  <RequireRole roles={MANAGER_ROLES}>
    {/* The filters live in the URL (useSearchParams) */}
    <Suspense fallback={<FullPageLoader />}>
      <RevenueContent />
    </Suspense>
  </RequireRole>
);
