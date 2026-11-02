import { PublicTeachersPage } from '@/components/public/teachers/PublicTeachersPage';
import { PageVisibilityGate } from '@/components/public/common/PageVisibilityGate';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Teachers' };

// Hidden from the Site Pages screen: "Page not found"
const TeachersRoute = () => (
  <PageVisibilityGate pageKey="teachers">
    <PublicTeachersPage />
  </PageVisibilityGate>
);

export default TeachersRoute;
