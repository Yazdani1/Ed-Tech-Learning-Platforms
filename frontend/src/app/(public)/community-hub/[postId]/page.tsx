import { DiscussionDetailPage } from '@/components/community/detail/DiscussionDetailPage';
import { PageVisibilityGate } from '@/components/public/common/PageVisibilityGate';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Discussion' };

interface DiscussionRouteProps {
  params: Promise<{ postId: string }>;
}

const DiscussionRoute = async ({ params }: DiscussionRouteProps) => {
  const { postId } = await params;
  return (
    <PageVisibilityGate pageKey="community-hub">
      <DiscussionDetailPage postId={postId} />
    </PageVisibilityGate>
  );
};

export default DiscussionRoute;
