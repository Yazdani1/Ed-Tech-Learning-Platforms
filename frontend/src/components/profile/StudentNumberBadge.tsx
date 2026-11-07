import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { MONO_FONT } from '@/theme/fonts';

import type { FC } from 'react';

interface StudentNumberBadgeProps {
  number: string;
}

const BADGE_SX = {
  order: { xs: 1, sm: 0 },
  alignSelf: { xs: 'flex-start', sm: 'flex-end' },
  mb: { sm: 1 },
  px: 1.5,
  py: 1,
  borderRadius: 2,
  bgcolor: 'background.paper',
  border: 1,
  borderColor: 'divider',
  boxShadow: 1,
  textAlign: 'center',
} as const;

/** The student's ID, shown left of the avatar on the profile (under it on phones). */
export const StudentNumberBadge: FC<StudentNumberBadgeProps> = ({ number }) => {
  const { t } = useTranslation();
  return (
    <Box sx={BADGE_SX}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', fontWeight: 700 }}
      >
        {t('profile.studentNumber')}
      </Typography>
      <Typography sx={{ fontFamily: MONO_FONT, fontWeight: 800, letterSpacing: 0.5 }}>
        {number}
      </Typography>
    </Box>
  );
};
