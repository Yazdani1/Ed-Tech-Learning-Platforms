'use client';

import AutoStories from '@mui/icons-material/AutoStories';
import PlayCircle from '@mui/icons-material/PlayCircle';
import Verified from '@mui/icons-material/Verified';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

const FEATURES = [
  { key: 'Library', icon: <AutoStories /> },
  { key: 'Video', icon: <PlayCircle /> },
  { key: 'Instructor', icon: <Verified /> },
] as const;

const featureSx = {
  display: 'flex',
  gap: 1.5,
  p: 1.5,
  borderRadius: 1,
  bgcolor: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.16)',
} as const;

/** The gradient left half of the sign-in/register card (desktop only, as in the old client). */
export const AuthHeroPanel = () => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        p: { xs: 3, sm: 4, md: 5 },
        color: 'common.white',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #0f766e 0%, #1565c0 55%, #7c3aed 100%)',
      }}
    >
      <Box>
        <Chip
          icon={<Verified />}
          label={t('auth.heroChip')}
          sx={{
            color: 'common.white',
            bgcolor: 'rgba(255,255,255,0.16)',
            border: '1px solid rgba(255,255,255,0.25)',
            fontWeight: 800,
            '& .MuiChip-icon': { color: 'common.white' },
          }}
        />
        <Typography variant="h3" sx={{ mt: 3, fontWeight: 900, lineHeight: 1.1 }}>
          {t('auth.heroTitle')}
        </Typography>
        <Typography sx={{ mt: 2, maxWidth: 440, lineHeight: 1.8, color: 'rgba(255,255,255,0.82)' }}>
          {t('auth.heroBody')}
        </Typography>
      </Box>
      <Stack spacing={1.5}>
        {FEATURES.map(({ key, icon }) => (
          <Box key={key} sx={featureSx}>
            <Box sx={{ display: 'flex', mt: 0.25 }}>{icon}</Box>
            <Box>
              <Typography sx={{ fontWeight: 800 }}>{t(`auth.hero${key}Title`)}</Typography>
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.78)', lineHeight: 1.55 }}
              >
                {t(`auth.hero${key}Body`)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};
