import { Suspense } from 'react';

import { FullPageLoader } from '@/components/common/FullPageLoader';
import { CommunityHubPage } from '@/components/community/hub/CommunityHubPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Community Hub' };

// Suspense: the hub's search and filters live in the URL (useSearchParams)
const CommunityHubRoute = () => (
  <Suspense fallback={<FullPageLoader />}>
    <CommunityHubPage />
  </Suspense>
);

export default CommunityHubRoute;
