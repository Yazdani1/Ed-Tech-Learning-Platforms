import PushPinIcon from '@mui/icons-material/PushPin';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

/** "Pinned discussion" strip on top of a pinned card. */
export const PinnedBanner = () => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        px: 2,
        py: 0.75,
        bgcolor: 'warning.light',
        color: 'warning.contrastText',
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <PushPinIcon fontSize="small" aria-hidden />
      {t('community.post.pinnedBanner')}
    </Box>
  );
};
