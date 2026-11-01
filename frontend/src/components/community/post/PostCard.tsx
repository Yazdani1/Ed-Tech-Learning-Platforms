'use client';

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { useRouter } from 'next/navigation';
import { useId } from 'react';

import { useReactToPost } from '@/api/community.api';
import { toastError } from '@/utils/toast-error';

import { communityPostHref, postImages } from '../common/community-utils';
import { ImageThumbnails } from '../common/ImageThumbnails';
import { ReactionBar } from '../common/ReactionBar';
import { useCommunityPermissions } from '../common/useCommunityPermissions';

import { PinnedBanner } from './PinnedBanner';
import { PostHeader } from './PostHeader';
import { PostSummary } from './PostSummary';

import type { CommunityBadge, CommunityChannel, Post } from '@/schemas/community.schema';
import type { FC, MouseEvent } from 'react';

const INTERACTIVE =
  'a, button, input, textarea, select, [role="button"], [role="menu"], [role="dialog"]';

const cardSx = (pinned: boolean) =>
  ({
    border: 1,
    borderColor: pinned ? 'warning.main' : 'divider',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'border-color 140ms ease, box-shadow 140ms ease',
    '&:hover': { borderColor: pinned ? 'warning.dark' : 'primary.light', boxShadow: 2 },
  }) as const;

interface PostCardProps {
  post: Post;
  badges: CommunityBadge[];
  channels: CommunityChannel[];
}

/** A discussion on the hub list: author, title, excerpt, thumbnails, reactions; opens the discussion. */
export const PostCard: FC<PostCardProps> = ({ post, badges, channels }) => {
  const router = useRouter();
  const titleId = useId();
  const { user } = useCommunityPermissions();
  const react = useReactToPost();
  const href = communityPostHref(post._id);

  const openCard = (event: MouseEvent<HTMLElement>): void => {
    const { target, currentTarget } = event;
    // Clicks in menus, popovers and dialogs (portals outside the card) or on a control do not open it
    if (!(target instanceof Element) || !currentTarget.contains(target)) return;
    if (target.closest(INTERACTIVE)) return;
    router.push(href);
  };

  return (
    <Paper
      component="article"
      aria-labelledby={titleId}
      elevation={0}
      onClick={openCard}
      sx={cardSx(post.isPinned)}
    >
      {post.isPinned && <PinnedBanner />}
      <Stack spacing={1.5} sx={{ p: { xs: 2, sm: 2.5 } }}>
        <PostHeader post={post} badges={badges} channels={channels} />
        <PostSummary
          titleId={titleId}
          title={post.title}
          description={post.description}
          href={href}
        />
        <ImageThumbnails images={postImages(post)} title={post.title} />
        <ReactionBar
          reactions={post.reactions}
          disabled={!user}
          currentUserId={user?._id}
          busy={react.isPending}
          onReact={(type) => {
            react.mutate({ id: post._id, type }, { onError: toastError });
          }}
          answerCount={post.replyCount ?? post.replies.length}
          onAnswerClick={() => {
            router.push(href);
          }}
        />
      </Stack>
    </Paper>
  );
};
