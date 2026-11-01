'use client';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';

import { useReactToPost } from '@/api/community.api';
import { SafeHtml } from '@/components/common/SafeHtml';
import { toastError } from '@/utils/toast-error';

import { postImages } from '../common/community-utils';
import { ImageGallery } from '../common/ImageGallery';
import { ReactionBar } from '../common/ReactionBar';
import { useCommunityPermissions } from '../common/useCommunityPermissions';

import { PinnedBanner } from './PinnedBanner';
import { PostHeader } from './PostHeader';

import type { CommunityBadge, CommunityChannel, Post } from '@/schemas/community.schema';
import type { FC } from 'react';

interface PostDetailCardProps {
  post: Post;
  badges: CommunityBadge[];
  channels: CommunityChannel[];
  answerCount: number;
}

/** The discussion itself on its page: full description (sanitised), picture gallery and reactions. */
export const PostDetailCard: FC<PostDetailCardProps> = ({
  post,
  badges,
  channels,
  answerCount,
}) => {
  const router = useRouter();
  const { user } = useCommunityPermissions();
  const react = useReactToPost();

  return (
    <>
      {post.isPinned && <PinnedBanner />}
      <Stack spacing={1.5} sx={{ p: { xs: 2, sm: 2.5 } }}>
        <PostHeader
          post={post}
          badges={badges}
          channels={channels}
          onArchived={() => {
            router.push('/community-hub');
          }}
        />
        <Typography
          variant="h5"
          component="h1"
          sx={{ fontWeight: 800, lineHeight: 1.25, wordBreak: 'break-word' }}
        >
          {post.title}
        </Typography>
        <SafeHtml
          html={post.description}
          sx={{ color: 'text.secondary', '& ul, & ol': { pl: 3 } }}
        />
        <ImageGallery images={postImages(post)} title={post.title} />
        <ReactionBar
          reactions={post.reactions}
          disabled={!user}
          currentUserId={user?._id}
          busy={react.isPending}
          onReact={(type) => {
            react.mutate({ id: post._id, type }, { onError: toastError });
          }}
          answerCount={answerCount}
        />
      </Stack>
    </>
  );
};
