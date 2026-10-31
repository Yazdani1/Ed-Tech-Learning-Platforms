'use client';

import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/hooks/useAuth';

import { ROLE_KEY, assignableRoles } from './user-utils';

import type { UserRole } from '@/types';
import type { FC } from 'react';

interface RoleSelectProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
}

/** Role picker with only the roles the viewer may give (an Admin: Moderator, Teacher, Student). */
export const RoleSelect: FC<RoleSelectProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const roles = assignableRoles(user?.role);

  return (
    <TextField
      select
      label={t('people.users.role')}
      value={value}
      onChange={(event) => {
        const next = roles.find((role) => role === event.target.value);
        if (next) onChange(next);
      }}
      fullWidth
      required
    >
      {roles.map((role) => (
        <MenuItem key={role} value={role} sx={{ minHeight: 44 }}>
          {t(`people.roles.${ROLE_KEY[role]}`)}
        </MenuItem>
      ))}
    </TextField>
  );
};
