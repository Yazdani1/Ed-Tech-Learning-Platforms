'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/utils/dateTime';
import { isCloudinaryUrl } from '@/utils/urls';

import type { PostedBy } from '@/schemas/learn.schema';
import type { FC } from 'react';

interface PostedByLineProps {
  postedBy: PostedBy | null | undefined;
  createdAt: string | undefined;
  /** The signed-in user's id: their own posts get a "You" badge */
  userId: string;
}

/** First letter of a name for an avatar without a picture. */
const initial = (name: string | undefined): string => name?.charAt(0).toUpperCase() ?? '?';

/** "Avatar Name (You) • Role • date" above every post (course player, staff Q&A, live classes). */
export const PostedByLine: FC<PostedByLineProps> = ({ postedBy, createdAt, userId }) => {
  const { t, i18n } = useTranslation();
  const name = postedBy?.name ?? t('learn.unknownUser');
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
      <Avatar
        src={isCloudinaryUrl(postedBy?.avatar) ? postedBy.avatar : undefined}
        alt=""
        sx={{ width: 24, height: 24, fontSize: 12, bgcolor: 'primary.main' }}
      >
        {initial(postedBy?.name)}
      </Avatar>
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
