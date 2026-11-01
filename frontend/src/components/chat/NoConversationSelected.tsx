import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

/** Staff inbox on wide screens before a conversation is chosen. */
export const NoConversationSelected = () => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        flex: 1,
        display: { xs: 'none', md: 'flex' },
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
        p: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background:
            'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.12) 100%)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <ForumOutlinedIcon sx={{ fontSize: 40, color: '#8b8ef5' }} />
      </Box>
      <Typography variant="h6" component="p" sx={{ fontWeight: 700, color: 'text.secondary' }}>
        {t('messaging.chat.selectTitle')}
      </Typography>
      <Typography variant="body2" color="text.disabled">
        {t('messaging.chat.selectBody')}
      </Typography>
    </Box>
  );
};
