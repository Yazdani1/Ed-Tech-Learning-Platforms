import { DiscussionDetailPage } from '@/components/community/detail/DiscussionDetailPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Discussion' };

interface DiscussionRouteProps {
  params: Promise<{ postId: string }>;
}

const DiscussionRoute = async ({ params }: DiscussionRouteProps) => {
  const { postId } = await params;
  return <DiscussionDetailPage postId={postId} />;
};

export default DiscussionRoute;
