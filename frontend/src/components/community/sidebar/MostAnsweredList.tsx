'use client';

import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';

import { communityPostHref, formatCount } from '../common/community-utils';

import type { Post } from '@/schemas/community.schema';
import type { FC } from 'react';

interface MostAnsweredListProps {
  posts: Post[];
}

/** The five discussions with the most answers (links), with answer and reaction counts. */
export const MostAnsweredList: FC<MostAnsweredListProps> = ({ posts }) => {
  const { t } = useTranslation();
  if (posts.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('community.sidebar.noAnswered')}
      </Typography>
    );
  }
  return (
    <Stack
      component="ul"
      divider={<Divider component="li" aria-hidden />}
      sx={{ m: 0, p: 0, listStyle: 'none' }}
    >
      {posts.map((post) => (
        <Box component="li" key={post._id} sx={{ py: 1.2 }}>
          <Link
            component={NextLink}
            href={communityPostHref(post._id)}
            underline="hover"
            color="inherit"
            title={post.title}
            sx={{ fontWeight: 800, display: 'block' }}
            noWrap
          >
            {post.title}
          </Link>
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              gap: 0.75,
              mt: 0.5,
              color: 'text.secondary',
              flexWrap: 'wrap',
            }}
          >
            <QuestionAnswerOutlinedIcon sx={{ fontSize: 18 }} aria-hidden />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {t('community.sidebar.answersCount', {
                value: formatCount(post.replyCount ?? post.replies.length),
              })}
            </Typography>
            <ThumbUpOutlinedIcon sx={{ fontSize: 18 }} aria-hidden />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {t('community.sidebar.reactionsCount', { value: formatCount(post.reactions.length) })}
            </Typography>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
};
