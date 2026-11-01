'use client';

import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/utils/dateTime';

import { safeImage } from './community-utils';

import type { PublicCommunityProfile } from '@/schemas/community.schema';
import type { FC } from 'react';

const PREVIEW_BADGES = 6;

interface PreviewDetailsProps {
  profile: PublicCommunityProfile;
}

/** Lower half of a visible profile preview: counts, badges, join date and points. */
export const PreviewDetails: FC<PreviewDetailsProps> = ({ profile }) => {
  const { t, i18n } = useTranslation();
  const counts = [
    { label: t('community.profile.discussions'), value: profile.stats.discussionsAsked },
    { label: t('community.profile.answered'), value: profile.stats.answersGiven },
  ];
  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {counts.map((item) => (
          <Box key={item.label} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5">{item.value}</Typography>
            <Typography sx={{ fontWeight: 700 }}>{item.label}</Typography>
          </Box>
        ))}
      </Box>
      <Divider />
      <Stack direction="row" sx={{ p: 2, flexWrap: 'wrap', gap: 0.75 }}>
        {profile.badges.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            {t('community.profile.noBadges')}
          </Typography>
        )}
        {profile.badges.slice(0, PREVIEW_BADGES).map((badge) => (
          <Chip
            key={badge._id}
            size="small"
            variant="outlined"
            label={badge.name}
            avatar={
              <Avatar src={safeImage(badge.imageUrl)} alt="">
                <EmojiEventsOutlinedIcon fontSize="small" />
              </Avatar>
            }
          />
        ))}
      </Stack>
      <Divider />
      <Stack
        direction="row"
        sx={{ p: 2, gap: 2, justifyContent: 'center', flexWrap: 'wrap', color: 'text.secondary' }}
      >
        {profile.user.createdAt && (
          <Typography variant="body2">
            {t('community.profile.joined', {
              date: formatDate(profile.user.createdAt, i18n.language),
            })}
          </Typography>
        )}
        <Typography variant="body2">
          {t('community.profile.points', { count: profile.user.communityPoints ?? 0 })}
        </Typography>
      </Stack>
    </>
  );
};
