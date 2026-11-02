import { Suspense } from 'react';

import { FullPageLoader } from '@/components/common/FullPageLoader';
import { CommunityHubPage } from '@/components/community/hub/CommunityHubPage';
import { PageVisibilityGate } from '@/components/public/common/PageVisibilityGate';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Community Hub' };

// Suspense: the hub's search and filters live in the URL (useSearchParams)
const CommunityHubRoute = () => (
  <PageVisibilityGate pageKey="community-hub">
    <Suspense fallback={<FullPageLoader />}>
      <CommunityHubPage />
    </Suspense>
  </PageVisibilityGate>
);

export default CommunityHubRoute;
