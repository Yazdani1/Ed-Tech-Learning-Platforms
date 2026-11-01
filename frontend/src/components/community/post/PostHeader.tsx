'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/utils/dateTime';

import { AuthorLine } from '../common/AuthorLine';

import { PostMenu } from './PostMenu';

import type { CommunityBadge, CommunityChannel, Post } from '@/schemas/community.schema';
import type { FC } from 'react';

interface PostHeaderProps {
  post: Post;
  badges: CommunityBadge[];
  channels: CommunityChannel[];
  onArchived?: () => void;
}

/** Author line, "date in Channel" and the discussion's "⋮" menu. */
export const PostHeader: FC<PostHeaderProps> = ({ post, badges, channels, onArchived }) => {
  const { t, i18n } = useTranslation();
  return (
    <Stack
      direction="row"
      sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <AuthorLine author={post.author} badges={badges} />
        <Typography variant="caption" color="text.secondary" component="div">
          {t('community.post.postedIn', { date: formatDateTime(post.createdAt, i18n.language) })}{' '}
          <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>
            {post.channel?.name ?? t('community.post.unknownChannel')}
          </Box>
        </Typography>
      </Box>
      <PostMenu post={post} channels={channels} onArchived={onArchived} />
    </Stack>
  );
};
