import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { UserAvatar } from '@/components/common/UserAvatar';

import { CHAT_GRADIENT } from './chat.utils';

import type { ChatStudent } from '@/schemas/chat.schema';
import type { FC } from 'react';

interface StaffChatHeaderProps {
  student: ChatStudent | null | undefined;
  online: boolean;
  /** Teachers never see student emails */
  showEmail: boolean;
  onBack: () => void;
}

const ONLINE_GREEN = '#4ade80';
const HEADER_SX = {
  px: { xs: 1, sm: 3 },
  py: 1.5,
  background: CHAT_GRADIENT,
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
} as const;

/** The open conversation's student: name, presence and (not for teachers) email; back button on phones. */
export const StaffChatHeader: FC<StaffChatHeaderProps> = ({
  student,
  online,
  showEmail,
  onBack,
}) => {
  const { t } = useTranslation();
  const name = student?.name ?? t('messaging.chat.studentFallback');
  return (
    <Box sx={HEADER_SX}>
      <IconButton
        onClick={onBack}
        aria-label={t('messaging.chat.back')}
        sx={{ display: { md: 'none' }, color: '#fff', width: 44, height: 44 }}
      >
        <ArrowBackIcon />
      </IconButton>
      <UserAvatar name={name} avatar={student?.avatar} size={38} color="rgba(255,255,255,0.25)" />
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: online ? ONLINE_GREEN : 'rgba(255,255,255,0.55)',
            }}
          />
          <Typography component="h2" sx={{ fontWeight: 700, fontSize: 14 }} noWrap>
            {name}
          </Typography>
          <Typography sx={{ fontSize: 11, opacity: 0.85, fontWeight: 600 }}>
            {online ? t('messaging.chat.activeNow') : t('messaging.chat.offline')}
          </Typography>
        </Box>
        {showEmail && student?.email && (
          <Typography sx={{ fontSize: 12, opacity: 0.8 }} noWrap>
            {student.email}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
