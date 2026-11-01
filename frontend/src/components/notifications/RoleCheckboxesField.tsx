'use client';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Typography from '@mui/material/Typography';
import { Controller, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { userRoleSchema } from '@/schemas/auth.schema';

import type { NotificationForm } from '@/schemas/notifications.schema';
import type { UserRole } from '@/types';
import type { FC } from 'react';

interface RoleCheckboxesFieldProps {
  control: Control<NotificationForm>;
}

const ROLE_OPTIONS = userRoleSchema.options;

const toggleRole = (roles: UserRole[], role: UserRole): UserRole[] =>
  roles.includes(role) ? roles.filter((item) => item !== role) : [...roles, role];

/** "Send to roles": one checkbox per role (two columns from tablets up). */
export const RoleCheckboxesField: FC<RoleCheckboxesFieldProps> = ({ control }) => {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name="targetRoles"
      render={({ field, fieldState }) => (
        <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
          <Typography component="legend" variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            {t('messaging.notifications.form.roles')}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            {ROLE_OPTIONS.map((role) => (
              <FormControlLabel
                key={role}
                sx={{ minHeight: 44 }}
                control={
                  <Checkbox
                    checked={field.value.includes(role)}
                    onChange={() => {
                      field.onChange(toggleRole(field.value, role));
                    }}
                  />
                }
                label={t(`messaging.notifications.roles.${role}`)}
              />
            ))}
          </Box>
          {fieldState.error?.message && (
            <FormHelperText error>{t(fieldState.error.message)}</FormHelperText>
          )}
        </Box>
      )}
    />
  );
};
