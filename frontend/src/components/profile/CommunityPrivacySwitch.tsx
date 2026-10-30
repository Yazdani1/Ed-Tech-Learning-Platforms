'use client';

import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { Controller, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { ProfileFormValues } from '@/schemas/profile.schema';
import type { FC } from 'react';

interface CommunityPrivacySwitchProps {
  control: Control<ProfileFormValues>;
}

/** "Private community profile" switch of the edit form. */
export const CommunityPrivacySwitch: FC<CommunityPrivacySwitchProps> = ({ control }) => {
  const { t } = useTranslation();
  return (
    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
      <Controller
        control={control}
        name="isCommunityProfilePrivate"
        render={({ field }) => (
          <FormControlLabel
            labelPlacement="start"
            sx={{ m: 0, width: '100%', justifyContent: 'space-between', gap: 1.5 }}
            control={
              <Switch
                checked={field.value}
                onChange={(event) => {
                  field.onChange(event.target.checked);
                }}
              />
            }
            label={
              <Box>
                <Typography sx={{ fontWeight: 900 }}>{t('profile.privateTitle')}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('profile.privateBody')}
                </Typography>
              </Box>
            }
          />
        )}
      />
    </Paper>
  );
};
