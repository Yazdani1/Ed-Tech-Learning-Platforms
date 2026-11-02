import { FreeCoursesView } from '@/components/browse/free/FreeCoursesView';
import { PageVisibilityGate } from '@/components/public/common/PageVisibilityGate';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Free Courses' };

// Hidden from the Site Pages screen: "Page not found"
const FreeCoursesPage = () => (
  <PageVisibilityGate pageKey="free-courses">
    <FreeCoursesView />
  </PageVisibilityGate>
);

export default FreeCoursesPage;
