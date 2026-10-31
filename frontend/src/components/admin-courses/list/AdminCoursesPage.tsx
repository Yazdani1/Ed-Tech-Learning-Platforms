import { Suspense } from 'react';

import { FullPageLoader } from '@/components/common/FullPageLoader';

import { AdminCoursesView } from './AdminCoursesView';

/** The staff course list reads its filters from the URL (useSearchParams), so it renders inside Suspense. */
export const AdminCoursesPage = () => (
  <Suspense fallback={<FullPageLoader />}>
    <AdminCoursesView />
  </Suspense>
);
