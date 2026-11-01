'use client';

import Stack from '@mui/material/Stack';

import { QueryState } from '@/components/common/QueryState';

import { useCommunityPermissions } from '../common/useCommunityPermissions';

import { CreatePostForm } from './CreatePostForm';
import { PostList } from './PostList';

import type { OverviewQuery } from '@/api/community.api';
import type { CommunityOverview } from '@/schemas/community.schema';
import type { FC } from 'react';

interface HubDiscussionsProps {
  query: OverviewQuery;
  first: CommunityOverview | undefined;
  formOpen: boolean;
  onCloseForm: () => void;
}

/** Middle column: the "Start a discussion" form (signed in) and the discussion list. */
export const HubDiscussions: FC<HubDiscussionsProps> = ({
  query,
  first,
  formOpen,
  onCloseForm,
}) => {
  const { user } = useCommunityPermissions();
  const posts = (query.data?.pages ?? []).flatMap((page) => page.posts);
  const channels = first?.channels ?? [];
  return (
    <Stack spacing={2.5} sx={{ minWidth: 0 }}>
      {formOpen && user && <CreatePostForm channels={channels} onClose={onCloseForm} />}
      <QueryState
        isLoading={query.isPending}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        <PostList
          posts={posts}
          badges={first?.badges ?? []}
          channels={channels}
          hasMore={query.hasNextPage}
          loadingMore={query.isFetchingNextPage}
          onLoadMore={() => void query.fetchNextPage()}
        />
      </QueryState>
    </Stack>
  );
};
