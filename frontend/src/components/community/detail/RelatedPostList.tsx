'use client';

import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { RelatedPostItem } from './RelatedPostItem';

import type { Post } from '@/schemas/community.schema';
import type { FC } from 'react';

interface RelatedPostListProps {
  posts: Post[];
}

/** Short list of discussions in the detail page sidebar. */
export const RelatedPostList: FC<RelatedPostListProps> = ({ posts }) => {
  const { t } = useTranslation();
  if (posts.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('community.detail.noRelated')}
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
        <RelatedPostItem key={post._id} post={post} />
      ))}
    </Stack>
  );
};
