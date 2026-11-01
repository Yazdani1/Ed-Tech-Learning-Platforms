'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

import { PostDetailCard } from '../post/PostDetailCard';

import { RelatedSidebar } from './RelatedSidebar';
import { ReplySection } from './ReplySection';

import type { PostDetail, Reply } from '@/schemas/community.schema';
import type { FC } from 'react';

const gridSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 340px' },
  gap: 2.5,
  alignItems: 'start',
} as const;

interface DiscussionViewProps {
  detail: PostDetail;
  /** Every loaded answer (all pages) */
  replies: Reply[];
  answerCount: number;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

/** The discussion card with its answers, and the related discussions beside it (below on phones). */
export const DiscussionView: FC<DiscussionViewProps> = ({
  detail,
  replies,
  answerCount,
  hasMore,
  loadingMore,
  onLoadMore,
}) => {
  const { post, badges, channels } = detail;
  return (
    <Box sx={gridSx}>
      <Paper
        component="article"
        aria-label={post.title}
        elevation={0}
        sx={{
          border: 1,
          borderColor: post.isPinned ? 'warning.main' : 'divider',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <PostDetailCard post={post} badges={badges} channels={channels} answerCount={answerCount} />
        <ReplySection
          postId={post._id}
          postAuthorId={post.author?._id}
          replies={replies}
          badges={badges}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={onLoadMore}
        />
      </Paper>
      <RelatedSidebar post={post} />
    </Box>
  );
};
