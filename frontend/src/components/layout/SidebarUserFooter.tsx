'use client';

import Logout from '@mui/icons-material/Logout';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useLogout } from '@/api/auth.api';
import { useAuth } from '@/hooks/useAuth';

import type { FC } from 'react';

interface SidebarUserFooterProps {
  collapsed: boolean;
}

/** Signed-in user's avatar, name and role, with the sign-out button. */
export const SidebarUserFooter: FC<SidebarUserFooterProps> = ({ collapsed }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const logoutMutation = useLogout();

  // RequireRole sees the signed-out user and opens /auth/login (it owns that navigation)
  const signOut = (): void => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => toast.success(t('auth.logoutSuccess')),
      onError: () => toast.error(t('auth.logoutFailed')),
    });
  };

  return (
    <Box sx={{ p: collapsed ? 1 : 2, display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar
        src={user?.avatar}
        alt=""
        sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}
      >
        {user?.name.charAt(0).toUpperCase()}
      </Avatar>
      {!collapsed && user && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {user.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="p">
            {t(`roles.${user.role}`)}
          </Typography>
        </Box>
      )}
      <Tooltip title={t('nav.logout')}>
        <IconButton
          aria-label={t('nav.logout')}
          onClick={signOut}
          disabled={logoutMutation.isPending}
          sx={{ width: 44, height: 44 }}
        >
          <Logout fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
