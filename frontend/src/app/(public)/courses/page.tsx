import { CourseBrowsePage } from '@/components/browse/catalog/CourseBrowsePage';
import { PageVisibilityGate } from '@/components/public/common/PageVisibilityGate';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'All Courses' };

// Hidden from the Site Pages screen: "Page not found"
const CoursesPage = () => (
  <PageVisibilityGate pageKey="courses">
    <CourseBrowsePage />
  </PageVisibilityGate>
);

export default CoursesPage;
