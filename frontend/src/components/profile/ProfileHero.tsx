'use client';

import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { isCloudinaryUrl } from '@/utils/urls';

import { ProfileFacts } from './ProfileFacts';
import { ROLE_COLORS, roleTextKey } from './subscription.utils';

import type { Profile } from '@/schemas/profile.schema';
import type { FC } from 'react';

const HERO_GRADIENT = 'linear-gradient(135deg, #0f766e 0%, #1565c0 55%, #7c3aed 100%)';
const AVATAR_SIZE = { xs: 104, md: 132 };

interface ProfileHeroProps {
  profile: Profile;
}

/** Banner with the role, the avatar, name, role description and account facts. */
export const ProfileHero: FC<ProfileHeroProps> = ({ profile }) => {
  const { t } = useTranslation();
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden', mb: 3 }}>
      <Box sx={{ minHeight: 150, background: HERO_GRADIENT, px: { xs: 2, md: 4 }, py: 3 }}>
        <Chip
          icon={<VerifiedUserOutlined />}
          label={t(`roles.${profile.role}`)}
          sx={{
            color: 'common.white',
            bgcolor: 'rgba(255,255,255,0.16)',
            border: '1px solid rgba(255,255,255,0.22)',
            fontWeight: 800,
            '& .MuiChip-icon': { color: 'common.white' },
          }}
        />
      </Box>
      <Box sx={{ px: { xs: 2, md: 4 }, pb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-end', flexWrap: 'wrap', mt: -7 }}>
          <Avatar
            src={isCloudinaryUrl(profile.avatar) ? profile.avatar : undefined}
            alt={profile.name}
            sx={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              border: '5px solid white',
              bgcolor: ROLE_COLORS[profile.role],
              fontSize: 48,
              fontWeight: 900,
            }}
          >
            {profile.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: 260 }, pt: { xs: 0, sm: 8 } }}>
            <Typography
              component="h2"
              variant="h4"
              sx={{ fontWeight: 900, lineHeight: 1.1, wordBreak: 'break-word' }}
            >
              {profile.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              {t(`profile.roleDescription.${roleTextKey(profile.role)}`)}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 3 }} />
        <ProfileFacts profile={profile} />
      </Box>
    </Paper>
  );
};
