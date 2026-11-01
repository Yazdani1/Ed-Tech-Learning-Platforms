import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CHAT_ACCENT, CHAT_GRADIENT } from './chat.utils';

/** A student's empty conversation: "Welcome to Support Chat!". */
export const ChatWelcome = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ textAlign: 'center', mt: 8, px: 2 }}>
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: CHAT_GRADIENT,
          display: 'grid',
          placeItems: 'center',
          mx: 'auto',
          mb: 2,
          boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
        }}
      >
        <SupportAgentIcon sx={{ color: '#fff', fontSize: 34 }} />
      </Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: CHAT_ACCENT, mb: 0.5 }}>
        {t('messaging.chat.welcomeTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t('messaging.chat.welcomeBody')}
      </Typography>
    </Box>
  );
};
