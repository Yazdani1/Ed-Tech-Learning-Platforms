'use client';

import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import CalendarToday from '@mui/icons-material/CalendarToday';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/utils/dateTime';

import { ProfileInfoItem } from './ProfileInfoItem';

import type { Profile } from '@/schemas/profile.schema';
import type { TFunction } from 'i18next';
import type { FC, ReactElement } from 'react';

const FACT_SIZE = { xs: 12, sm: 6 } as const;

interface Fact {
  key: string;
  icon: ReactElement;
  label: string;
  value: string;
}

/** The facts shown for this profile (a student's number is shown left of the avatar instead). */
const buildFacts = (t: TFunction, profile: Profile): Fact[] => {
  const notAvailable = t('profile.notAvailable');
  const facts: Fact[] = [
    { key: 'email', icon: <EmailOutlined />, label: t('profile.email'), value: profile.email },
    {
      key: 'phone',
      icon: <PhoneOutlined />,
      label: t('profile.phone'),
      value: profile.phone ?? notAvailable,
    },
    {
      key: 'role',
      icon: <BadgeOutlined />,
      label: t('profile.role'),
      value: t(`roles.${profile.role}`),
    },
    {
      key: 'joined',
      icon: <CalendarToday />,
      label: t('profile.joined'),
      value: formatDateTime(profile.createdAt) || notAvailable,
    },
    {
      key: 'updated',
      icon: <SecurityOutlined />,
      label: t('profile.lastUpdated'),
      value: formatDateTime(profile.updatedAt) || notAvailable,
    },
  ];
  return facts;
};

interface ProfileFactsProps {
  profile: Profile;
}

/** Student number (students), email, phone, role, joined and last-updated dates, and who may edit the account. */
export const ProfileFacts: FC<ProfileFactsProps> = ({ profile }) => {
  const { t } = useTranslation();
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Grid container spacing={2.5}>
          {buildFacts(t, profile).map(({ key, ...fact }) => (
            <Grid key={key} size={FACT_SIZE}>
              <ProfileInfoItem {...fact} />
            </Grid>
          ))}
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
