'use client';

import DevicesIcon from '@mui/icons-material/Devices';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { SOFT_BG, SOFT_BORDER } from '../detail-styles';

const PERKS_SX = {
  listStyle: 'none',
  m: 0,
  mt: 2.5,
  p: 2.5,
  display: 'grid',
  gap: 2,
  bgcolor: SOFT_BG,
  border: `1px solid ${SOFT_BORDER}`,
  borderRadius: '14px',
} as const;

/** The soft box of perks on the enrolment card: certificate, any device, direct support. */
export const EnrollmentPerks = () => {
  const { t } = useTranslation();
  const perks = [
    {
      icon: <WorkspacePremiumOutlinedIcon sx={{ color: '#047857' }} />,
      text: t('browse.enroll.certificate'),
    },
    { icon: <DevicesIcon sx={{ color: '#c2410c' }} />, text: t('browse.enroll.anyDeviceLong') },
    { icon: <ForumOutlinedIcon sx={{ color: '#047857' }} />, text: t('browse.enroll.support') },
  ];
  return (
    <Box component="ul" sx={PERKS_SX}>
      {perks.map((perk) => (
        <Box
          component="li"
          key={perk.text}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}
        >
          <Box sx={{ display: 'flex' }} aria-hidden>
            {perk.icon}
          </Box>
          <Typography variant="body2">{perk.text}</Typography>
        </Box>
      ))}
    </Box>
  );
};
