'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { LoadMoreButton } from '../common/LoadMoreButton';
import { PostCard } from '../post/PostCard';

import { useLoadMoreOnScroll } from './useLoadMoreOnScroll';

import type { CommunityBadge, CommunityChannel, Post } from '@/schemas/community.schema';
import type { FC } from 'react';

interface PostListProps {
  posts: Post[];
  badges: CommunityBadge[];
  channels: CommunityChannel[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

/** The discussions (pinned first, as the server sorts them), loading more as the visitor scrolls. */
export const PostList: FC<PostListProps> = ({
  posts,
  badges,
  channels,
  hasMore,
  loadingMore,
  onLoadMore,
}) => {
  const { t } = useTranslation();
  const sentinel = useLoadMoreOnScroll(hasMore && !loadingMore, onLoadMore);

  if (posts.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: 1, borderColor: 'divider' }}>
        <Typography sx={{ fontWeight: 900 }}>{t('community.list.empty')}</Typography>
        <Typography color="text.secondary">{t('community.list.emptyHint')}</Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={2.5}>
      {posts.map((post) => (
        <PostCard key={post._id} post={post} badges={badges} channels={channels} />
      ))}
      <Box ref={sentinel} sx={{ minHeight: 1 }} />
      {hasMore && (
        <LoadMoreButton
          label={t('community.list.loadMore')}
          loadingLabel={t('community.list.loadingMore')}
          loading={loadingMore}
          onClick={onLoadMore}
        />
      )}
    </Stack>
  );
};
