'use client';

import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { safeImage } from '../common/community-utils';

import type { CommunityBadge } from '@/schemas/community.schema';
import type { FC } from 'react';

interface ProfileBadgesProps {
  badges: CommunityBadge[];
}

/** The badges the member has earned (points at least the badge's requirement). */
export const ProfileBadges: FC<ProfileBadgesProps> = ({ badges }) => {
  const { t } = useTranslation();
  return (
    <Paper
      component="section"
      aria-label={t('community.profile.badgesTitle')}
      elevation={0}
      sx={{ p: 2, border: 1, borderColor: 'divider' }}
    >
      <Typography variant="h6" component="h2" sx={{ fontWeight: 900, mb: 1.5 }}>
        {t('community.profile.badgesTitle')}
      </Typography>
      {badges.length === 0 && (
        <Typography color="text.secondary">{t('community.profile.noBadges')}</Typography>
      )}
      <Stack spacing={1}>
        {badges.map((badge) => (
          <Stack key={badge._id} direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Avatar
              src={safeImage(badge.imageUrl)}
              alt=""
              variant="rounded"
              sx={{ bgcolor: 'success.light' }}
            >
              <EmojiEventsOutlinedIcon />
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 900 }}>{badge.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t('community.author.points', { count: badge.requiredPoints })}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
};
