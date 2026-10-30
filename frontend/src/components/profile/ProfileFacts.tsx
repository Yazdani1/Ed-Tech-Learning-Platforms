'use client';

import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import CalendarToday from '@mui/icons-material/CalendarToday';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/utils/dateTime';

import { ProfileInfoItem } from './ProfileInfoItem';

import type { Profile } from '@/schemas/profile.schema';
import type { FC } from 'react';

const FACT_SIZE = { xs: 12, sm: 6 } as const;

interface ProfileFactsProps {
  profile: Profile;
}

/** Email, role, joined and last-updated dates, and who may edit the account. */
export const ProfileFacts: FC<ProfileFactsProps> = ({ profile }) => {
  const { t } = useTranslation();
  const notAvailable = t('profile.notAvailable');
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Grid container spacing={2.5}>
          <Grid size={FACT_SIZE}>
            <ProfileInfoItem
              icon={<EmailOutlined />}
              label={t('profile.email')}
              value={profile.email}
            />
          </Grid>
          <Grid size={FACT_SIZE}>
            <ProfileInfoItem
              icon={<BadgeOutlined />}
              label={t('profile.role')}
              value={t(`roles.${profile.role}`)}
            />
          </Grid>
          <Grid size={FACT_SIZE}>
            <ProfileInfoItem
              icon={<CalendarToday />}
              label={t('profile.joined')}
              value={formatDateTime(profile.createdAt) || notAvailable}
            />
          </Grid>
          <Grid size={FACT_SIZE}>
            <ProfileInfoItem
              icon={<SecurityOutlined />}
              label={t('profile.lastUpdated')}
              value={formatDateTime(profile.updatedAt) || notAvailable}
            />
          </Grid>
        </Grid>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 800, mb: 1 }}>
            {t('profile.accessTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {t('profile.accessBody')}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};
