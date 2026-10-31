'use client';

import { Suspense } from 'react';

import { FullPageLoader } from '@/components/common/FullPageLoader';
import { RequireRole } from '@/components/permissions/RequireRole';
import { MANAGER_ROLES } from '@/utils/roles';

import { SubscriptionsView } from './SubscriptionsView';

/** /admin/subscriptions: Super Admin and Admin. The tab and filters live in the URL, so Suspense. */
export const SubscriptionsPage = () => (
  <RequireRole roles={MANAGER_ROLES}>
    <Suspense fallback={<FullPageLoader />}>
      <SubscriptionsView />
    </Suspense>
  </RequireRole>
);
