'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/utils/dateTime';

import { initial, safeImage } from '../common/community-utils';
import { useCommunityPermissions } from '../common/useCommunityPermissions';

import { PrivacyToggle } from './PrivacyToggle';

import type { PublicCommunityProfile } from '@/schemas/community.schema';
import type { FC } from 'react';

const HERO_GRADIENT = 'linear-gradient(135deg, #0f766e 0%, #1565c0 48%, #7c3aed 100%)';
const chipSx = { bgcolor: 'rgba(255,255,255,0.16)', color: 'common.white', fontWeight: 900 };

interface ProfileHeroProps {
  user: PublicCommunityProfile['user'];
}

/** Coloured banner: avatar, name, role, points, member since, and the privacy switch on your own profile. */
export const ProfileHero: FC<ProfileHeroProps> = ({ user }) => {
  const { t, i18n } = useTranslation();
  const { isMine } = useCommunityPermissions();

  return (
    <Paper
      elevation={0}
      sx={{ p: { xs: 2.5, md: 4 }, color: 'common.white', background: HERO_GRADIENT }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ gap: 2.5, alignItems: { sm: 'center' } }}
      >
        <Avatar
          src={safeImage(user.avatar)}
          alt=""
          sx={{
            width: 110,
            height: 110,
            fontSize: 42,
            bgcolor: 'primary.main',
            border: '5px solid rgba(255,255,255,0.88)',
          }}
        >
          {initial(user.name)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 900, wordBreak: 'break-word' }}>
            {user.name}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.75 }}>
            {t('community.profile.intro')}
          </Typography>
          <Stack direction="row" sx={{ mt: 1, gap: 1, flexWrap: 'wrap' }}>
            <Chip label={user.role} sx={chipSx} />
            <Chip
              label={t('community.author.points', { count: user.communityPoints ?? 0 })}
              sx={chipSx}
            />
            {user.createdAt && (
              <Chip
                label={t('community.profile.memberSince', {
                  date: formatDate(user.createdAt, i18n.language),
                })}
                sx={chipSx}
              />
            )}
          </Stack>
        </Box>
        {isMine(user._id) && (
          <PrivacyToggle userId={user._id} isPrivate={user.isCommunityProfilePrivate} />
        )}
      </Stack>
    </Paper>
  );
};
