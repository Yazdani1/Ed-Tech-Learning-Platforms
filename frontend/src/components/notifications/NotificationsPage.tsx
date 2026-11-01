import { Suspense } from 'react';

import { FullPageLoader } from '@/components/common/FullPageLoader';

import { NotificationsScreen } from './NotificationsScreen';

/** /admin|/student|/teacher/notifications. The tab and page live in the URL (useSearchParams): Suspense. */
export const NotificationsPage = () => (
  <Suspense fallback={<FullPageLoader />}>
    <NotificationsScreen />
  </Suspense>
);
