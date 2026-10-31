'use client';

import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useUsers } from '@/api/people.api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

import type { ManagedUser } from '@/schemas/people.schema';
import type { FC } from 'react';

interface UserPickerProps {
  /** Called with the chosen user's id ('' when cleared) */
  onChange: (userId: string) => void;
  error?: boolean;
  helperText?: string;
}

/** Users shown per search. */
const PICKER_LIMIT = 20;

/**
 * Finds a user by name or email (server search, one request per typing pause). It keeps its own choice;
 * it lives inside a dialog, so every opening starts empty.
 */
export const UserPicker: FC<UserPickerProps> = ({ onChange, error, helperText }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [input, setInput] = useState('');
  const search = useDebouncedValue(input.trim());
  const users = useUsers({ search, limit: PICKER_LIMIT, page: 1 });

  return (
    <Autocomplete
      options={users.data?.data ?? []}
      value={selected}
      onChange={(_event, user) => {
        setSelected(user);
        onChange(user?._id ?? '');
      }}
      inputValue={input}
      onInputChange={(_event, text) => {
        setInput(text);
      }}
      filterOptions={(options) => options}
      getOptionLabel={(user) => `${user.name} (${user.email})`}
      isOptionEqualToValue={(option, value) => option._id === value._id}
      loading={users.isFetching}
      noOptionsText={t('people.subscriptions.noUsers')}
      loadingText={t('common.loading')}
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('people.subscriptions.user')}
          required
          error={error}
          helperText={helperText}
        />
      )}
    />
  );
};
