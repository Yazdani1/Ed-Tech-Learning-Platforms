import { CommunityProfilePage } from '@/components/community/profile/CommunityProfilePage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Community profile' };

interface CommunityProfileRouteProps {
  params: Promise<{ userId: string }>;
}

const CommunityProfileRoute = async ({ params }: CommunityProfileRouteProps) => {
  const { userId } = await params;
  return <CommunityProfilePage userId={userId} />;
};

export default CommunityProfileRoute;
