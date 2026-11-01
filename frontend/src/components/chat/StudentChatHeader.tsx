import CloseIcon from '@mui/icons-material/Close';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CHAT_GRADIENT } from './chat.utils';
import { OnlinePill } from './OnlinePill';

import type { FC } from 'react';

interface StudentChatHeaderProps {
  /** The floating widget's close button */
  onClose?: () => void;
  /** Heading level of the title (h1 on the page, h2 in the widget) */
  headingComponent: 'h1' | 'h2';
}

const HEADER_SX = {
  px: { xs: 2, sm: 3 },
  py: 2,
  background: CHAT_GRADIENT,
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
} as const;

const ICON_CIRCLE_SX = {
  width: 42,
  height: 42,
  borderRadius: '50%',
  bgcolor: 'rgba(255,255,255,0.2)',
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
} as const;

/** "Support Chat — Our team is here to help you" with the Online pill (student page and widget). */
export const StudentChatHeader: FC<StudentChatHeaderProps> = ({ onClose, headingComponent }) => {
  const { t } = useTranslation();
  return (
    <Box sx={HEADER_SX}>
      <Box sx={ICON_CIRCLE_SX}>
        <SupportAgentIcon sx={{ fontSize: 22 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography component={headingComponent} sx={{ fontWeight: 700, fontSize: 15 }}>
          {t('messaging.chat.title')}
        </Typography>
        <Typography sx={{ fontSize: 12, opacity: 0.85 }}>{t('messaging.chat.subtitle')}</Typography>
      </Box>
      <OnlinePill />
      {onClose && (
        <IconButton
          onClick={onClose}
          aria-label={t('messaging.chat.closeWidget')}
          sx={{ color: '#fff', width: 44, height: 44 }}
        >
          <CloseIcon />
        </IconButton>
      )}
    </Box>
  );
};
