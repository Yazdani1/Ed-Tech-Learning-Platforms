'use client';

import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { ManagedUser, TeacherForm } from '@/schemas/people.schema';
import type { FC } from 'react';

interface TeacherAccountSelectProps {
  form: UseFormReturn<TeacherForm>;
  linkableUsers: ManagedUser[];
}

/** "Link to Teacher User Account": None, or a Teacher account not linked to another profile. */
export const TeacherAccountSelect: FC<TeacherAccountSelectProps> = ({ form, linkableUsers }) => {
  const { t } = useTranslation();
  return (
    <Controller
      control={form.control}
      name="userId"
      render={({ field }) => (
        <TextField
          select
          label={t('people.teachers.linkAccount')}
          value={field.value}
          onChange={(event) => {
            const userId = event.target.value;
            field.onChange(userId);
            const linked = linkableUsers.find((user) => user._id === userId);
            // Picking an account fills in its name (as before) when the name is still empty
            if (linked && !form.getValues('name').trim()) form.setValue('name', linked.name);
          }}
          fullWidth
        >
          <MenuItem value="" sx={{ minHeight: 44 }}>
            <em>{t('people.teachers.noAccount')}</em>
          </MenuItem>
          {linkableUsers.map((user) => (
            <MenuItem key={user._id} value={user._id} sx={{ minHeight: 44 }}>
              {user.name} — {user.email}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
};
