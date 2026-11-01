'use client';

import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/utils/dateTime';

import {
  communityPostHref,
  formatCount,
  REACTION_ICONS,
  reactionSummary,
} from '../common/community-utils';

import type { Post } from '@/schemas/community.schema';
import type { FC } from 'react';

const TOP_REACTIONS = 2;
const countSx = { alignItems: 'center', gap: 0.5 };

interface RelatedPostItemProps {
  post: Post;
}

/** A sidebar discussion: title (link), author, top reactions, answer count and date. */
export const RelatedPostItem: FC<RelatedPostItemProps> = ({ post }) => {
  const { t, i18n } = useTranslation();
  const top = reactionSummary(post.reactions).slice(0, TOP_REACTIONS);
  const reactions = formatCount(post.reactions.length);
  const answers = formatCount(post.replies.length);
  return (
    <Box component="li" sx={{ py: 1.25 }}>
      <Link
        component={NextLink}
        href={communityPostHref(post._id)}
        underline="hover"
        color="inherit"
        sx={{ fontWeight: 800, display: 'block' }}
      >
        {post.title}
      </Link>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
        {post.author?.name ?? t('community.author.unknown')}
      </Typography>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap', color: 'text.secondary' }}
      >
        <Stack
          direction="row"
          sx={countSx}
          aria-label={t('community.sidebar.reactionsCount', { value: reactions })}
        >
          {top.length === 0 && <ThumbUpOutlinedIcon sx={{ fontSize: 18 }} aria-hidden />}
          {top.map((item) => (
            <Box component="span" key={item.type} aria-hidden>
              {REACTION_ICONS[item.type]}
            </Box>
          ))}
          <Typography variant="caption">{reactions}</Typography>
        </Stack>
        <Stack
          direction="row"
          sx={countSx}
          aria-label={t('community.sidebar.answersCount', { value: answers })}
        >
          <ChatBubbleOutlinedIcon sx={{ fontSize: 18 }} aria-hidden />
          <Typography variant="caption">{answers}</Typography>
        </Stack>
        <Typography variant="caption">{formatDate(post.createdAt, i18n.language)}</Typography>
      </Stack>
    </Box>
  );
};
