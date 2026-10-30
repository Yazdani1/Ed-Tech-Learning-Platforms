'use client';

import CalendarToday from '@mui/icons-material/CalendarToday';
import MenuBook from '@mui/icons-material/MenuBook';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/utils/dateTime';

import { ProfileInfoItem } from './ProfileInfoItem';

import type { CurrentPlan } from './subscription.utils';
import type { SubscriptionPlan } from '@/schemas/catalog.schema';
import type { FC } from 'react';

export const PLAN_COLOR = '#7c3aed';
const PLAN_TINT = 'rgba(124,58,237,0.04)';
const INFO_SIZE = { xs: 12, sm: 4 } as const;

interface ActivePlanDetailsProps {
  plan: CurrentPlan;
  /** The plan's configuration (course count, features), when it loaded */
  config: SubscriptionPlan | undefined;
}

/** The running plan: name, dates, included courses and features. */
export const ActivePlanDetails: FC<ActivePlanDetailsProps> = ({ plan, config }) => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: PLAN_COLOR,
        bgcolor: PLAN_TINT,
        mb: 2.5,
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
        <Chip
          label={plan.plan}
          size="small"
          sx={{ bgcolor: PLAN_COLOR, color: 'common.white', fontWeight: 800 }}
        />
        <Chip label={t('profile.active')} size="small" color="success" />
      </Box>
      <Grid container spacing={2}>
        <Grid size={INFO_SIZE}>
          <ProfileInfoItem
            icon={<CalendarToday />}
            label={t('profile.started')}
            value={formatDate(plan.startDate) || t('profile.notAvailable')}
          />
        </Grid>
        <Grid size={INFO_SIZE}>
          <ProfileInfoItem
            icon={<CalendarToday />}
            label={t('profile.expiresLabel')}
            value={formatDate(plan.endDate)}
          />
        </Grid>
        {config && (
          <Grid size={INFO_SIZE}>
            <ProfileInfoItem
              icon={<MenuBook />}
              label={t('profile.included')}
              value={t('profile.courseCount', { count: config.courseCount })}
            />
          </Grid>
        )}
      </Grid>
      {config && config.features.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Divider sx={{ mb: 1.5 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {config.features.map((feature) => (
              <Chip key={feature} label={feature} size="small" variant="outlined" />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};
