'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { UserAvatar } from '@/components/common/UserAvatar';
import { useAuth } from '@/hooks/useAuth';

const AVATAR_SIZE = 40;

/** Top right of the signed-in shell: avatar, name and role (students: their student number instead). */
export const TopBarUser = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  if (!user) return null;
  const detail =
    user.role === 'Student'
      ? user.studentNumber
        ? t('shell.studentNumber', { number: user.studentNumber })
        : null
      : t(`roles.${user.role}`);
  return (
    <Box
      data-testid="top-bar-user"
      sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, ml: 1 }}
    >
      <UserAvatar name={user.name} avatar={user.avatar} size={AVATAR_SIZE} />
      <Box sx={{ minWidth: 0, maxWidth: { xs: 140, sm: 220 } }}>
        <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
          {user.name}
        </Typography>
        {detail && (
          <Typography variant="caption" color="text.secondary" noWrap component="p">
            {detail}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
