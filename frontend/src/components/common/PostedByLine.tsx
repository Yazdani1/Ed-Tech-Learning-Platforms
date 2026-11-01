'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/utils/dateTime';

import { UserAvatar } from './UserAvatar';

import type { PostedBy } from '@/schemas/learn.schema';
import type { FC } from 'react';

interface PostedByLineProps {
  postedBy: PostedBy | null | undefined;
  createdAt: string | undefined;
  /** The signed-in user's id: their own posts get a "You" badge */
  userId: string;
}

/** "Avatar Name (You) • Role • date" above every post (course player, staff Q&A, live classes). */
export const PostedByLine: FC<PostedByLineProps> = ({ postedBy, createdAt, userId }) => {
  const { t, i18n } = useTranslation();
  const name = postedBy?.name ?? t('learn.unknownUser');
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
      <UserAvatar name={postedBy?.name} avatar={postedBy?.avatar} size={24} color="primary.main" />
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {name}
      </Typography>
      {postedBy?._id === userId && (
        <Chip
          label={t('learn.you')}
          size="small"
          color="primary"
          sx={{ height: 18, fontSize: '0.65rem' }}
        />
      )}
      {postedBy && (
        <Chip
          label={postedBy.role}
          size="small"
          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
        />
      )}
      {createdAt && (
        <Typography variant="caption" color="text.secondary">
          {formatDateTime(createdAt, i18n.language)}
        </Typography>
      )}
    </Box>
  );
};
