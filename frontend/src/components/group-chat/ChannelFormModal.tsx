'use client';

import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';
import { useFieldError } from '@/hooks/useFieldError';

import { useChannelForm } from './useChannelForm';

import type { Channel } from '@/schemas/group-chat.schema';
import type { FC } from 'react';

interface ChannelFormModalProps {
  open: boolean;
  /** The channel being edited; undefined to create one */
  channel: Channel | undefined;
  onClose: () => void;
  /** Called with the saved channel (e.g. to open a new one) */
  onSaved: (channel: Channel) => void;
}

const DESCRIPTION_ROWS = 3;

/** Create or edit a channel: name, description, Public / Private. */
export const ChannelFormModal: FC<ChannelFormModalProps> = ({
  open,
  channel,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const { form, submit, error, saving } = useChannelForm({ open, channel, onSaved, onClose });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t(channel ? 'groupChat.editChannel' : 'groupChat.createChannel')}
      onSave={submit}
      saveLabel={t(channel ? 'groupChat.form.update' : 'groupChat.form.create')}
      saving={saving}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {error && <Alert severity="error">{error.message}</Alert>}
        <TextField
          {...form.register('name')}
          label={t('groupChat.form.name')}
          required
          fullWidth
          autoFocus
          {...fieldError(form.formState.errors.name)}
        />
        <TextField
          {...form.register('description')}
          label={t('groupChat.form.description')}
          fullWidth
          multiline
          rows={DESCRIPTION_ROWS}
          {...fieldError(form.formState.errors.description)}
        />
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <TextField {...field} select fullWidth label={t('groupChat.form.type')}>
              <MenuItem value="Public">{t('groupChat.form.public')}</MenuItem>
              <MenuItem value="Private">{t('groupChat.form.private')}</MenuItem>
            </TextField>
          )}
        />
      </Stack>
    </AppModal>
  );
};
