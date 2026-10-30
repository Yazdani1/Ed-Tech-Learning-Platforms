'use client';

import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { ProfileInfoItem } from './ProfileInfoItem';
import { roleTextKey } from './subscription.utils';

import type { UserRole } from '@/types';
import type { FC } from 'react';

interface RoleDetailsCardProps {
  role: UserRole;
}

/** The role, its kind of access and what the account is for. */
export const RoleDetailsCard: FC<RoleDetailsCardProps> = ({ role }) => {
  const { t } = useTranslation();
  const key = roleTextKey(role);
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
      <Typography component="h2" variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
        {t('profile.roleDetails')}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ProfileInfoItem
            icon={<BadgeOutlined />}
            label={t('profile.role')}
            value={t(`roles.${role}`)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ProfileInfoItem
            icon={<SecurityOutlined />}
            label={t('profile.permissions')}
            value={t(`profile.permission.${key === 'moderator' ? 'admin' : key}`)}
          />
        </Grid>
        <Grid size={12}>
          <Divider />
        </Grid>
        <Grid size={12}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            {t(`profile.roleDescription.${key}`)}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};
