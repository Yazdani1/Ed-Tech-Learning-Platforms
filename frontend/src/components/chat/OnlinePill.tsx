import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

const ONLINE_GREEN = '#4ade80';

/** The "● Online" pill in the student chat header. */
export const OnlinePill = () => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        ml: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        bgcolor: 'rgba(255,255,255,0.15)',
        borderRadius: 5,
        px: 1.25,
        py: 0.5,
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          bgcolor: ONLINE_GREEN,
          boxShadow: `0 0 6px ${ONLINE_GREEN}`,
        }}
      />
      <Typography sx={{ fontSize: 11, fontWeight: 600 }}>{t('messaging.chat.online')}</Typography>
    </Box>
  );
};
