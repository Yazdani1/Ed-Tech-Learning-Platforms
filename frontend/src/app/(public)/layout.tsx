import { PublicLayout } from '@/components/public/PublicLayout';

import type { FC, ReactNode } from 'react';

interface PublicGroupLayoutProps {
  children: ReactNode;
}

/** Public pages (home, catalog, course details, teachers, pricing, community, practice quiz): top bar + footer. */
const PublicGroupLayout: FC<PublicGroupLayoutProps> = ({ children }) => (
  <PublicLayout>{children}</PublicLayout>
);

export default PublicGroupLayout;
