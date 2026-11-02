'use client';

import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { Controller, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { SetupItemRequest } from '@/schemas/setup.schema';
import type { FC } from 'react';

interface LiveTypeSwitchProps {
  control: Control<SetupItemRequest>;
}

/** Course types only: "Live course type" (its courses fill the home page's Live Courses section). */
export const LiveTypeSwitch: FC<LiveTypeSwitchProps> = ({ control }) => {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name="isLive"
      render={({ field }) => (
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(field.value)}
              onChange={(event) => {
                field.onChange(event.target.checked);
              }}
            />
          }
          label={t('showcase.setup.isLive')}
        />
      )}
    />
  );
};
