import { CommunityProfilePage } from '@/components/community/profile/CommunityProfilePage';
import { PageVisibilityGate } from '@/components/public/common/PageVisibilityGate';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Community profile' };

interface CommunityProfileRouteProps {
  params: Promise<{ userId: string }>;
}

const CommunityProfileRoute = async ({ params }: CommunityProfileRouteProps) => {
  const { userId } = await params;
  return (
    <PageVisibilityGate pageKey="community-hub">
      <CommunityProfilePage userId={userId} />
    </PageVisibilityGate>
  );
};

export default CommunityProfileRoute;
