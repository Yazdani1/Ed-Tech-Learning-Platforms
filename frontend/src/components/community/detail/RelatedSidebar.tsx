'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useRelatedPosts } from '@/api/community.api';

import { RelatedPostList } from './RelatedPostList';

import type { Post } from '@/schemas/community.schema';
import type { FC } from 'react';

const SIDEBAR_POSTS = 5;

interface RelatedSidebarProps {
  post: Post;
}

const byAnswersThenDate = (a: Post, b: Post): number =>
  b.replies.length - a.replies.length ||
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

/** "Latest in <channel>" and "Most answered" from the same channel (this discussion left out). */
export const RelatedSidebar: FC<RelatedSidebarProps> = ({ post }) => {
  const { t } = useTranslation();
  const related = useRelatedPosts(post.channel?._id);
  const others = (related.data ?? []).filter((item) => item._id !== post._id);
  const channel = post.channel?.name ?? t('community.post.unknownChannel');
  const sections = [
    {
      title: t('community.detail.latestIn', { channel }),
      hint: t('community.detail.latestHint'),
      posts: others.slice(0, SIDEBAR_POSTS),
    },
    {
      title: t('community.detail.mostAnswered'),
      hint: t('community.detail.mostAnsweredHint', { channel }),
      posts: [...others].sort(byAnswersThenDate).slice(0, SIDEBAR_POSTS),
    },
  ];

  return (
    <Paper component="aside" elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
      <Stack spacing={2} divider={<Divider />}>
        {sections.map((section) => (
          <Box key={section.title}>
            <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 800 }}>
              {section.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {section.hint}
            </Typography>
            {related.isPending && post.channel ? (
              <Skeleton variant="rounded" height={80} />
            ) : (
              <RelatedPostList posts={section.posts} />
            )}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};
