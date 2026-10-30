'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useSaveSetupItem } from '@/api/setup.api';
import { AppModal } from '@/components/common/AppModal';
import { useFieldError } from '@/hooks/useFieldError';
import {
  setupItemRequestSchema,
  type SetupItem,
  type SetupItemRequest,
  type SetupKind,
} from '@/schemas/setup.schema';

import type { FC } from 'react';

interface SetupItemFormModalProps {
  kind: SetupKind;
  open: boolean;
  /** The item being edited; undefined to add a new one */
  item: SetupItem | undefined;
  onClose: () => void;
}

const DESCRIPTION_ROWS = 3;

/** Add or edit a category / course type (name required, description optional). */
export const SetupItemFormModal: FC<SetupItemFormModalProps> = ({ kind, open, item, onClose }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const save = useSaveSetupItem(kind);
  const form = useForm<SetupItemRequest>({
    resolver: zodResolver(setupItemRequestSchema),
    defaultValues: { name: '', description: '' },
  });
  const { reset } = form;
  const { reset: resetMutation } = save;

  useEffect(() => {
    if (!open) return;
    reset({ name: item?.name ?? '', description: item?.description ?? '' });
    resetMutation();
  }, [open, item, reset, resetMutation]);

  const onSave = form.handleSubmit((body) => {
    save.mutate(
      { id: item?._id, body },
      {
        onSuccess: () => {
          toast.success(t(`showcase.setup.${kind}.${item ? 'updated' : 'created'}`));
          onClose();
        },
      },
    );
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t(`showcase.setup.${kind}.${item ? 'edit' : 'add'}`)}
      onSave={() => void onSave()}
      saveLabel={item ? t('common.update') : t('common.save')}
      saving={save.isPending}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {save.error && <Alert severity="error">{save.error.message}</Alert>}
        <TextField
          {...form.register('name')}
          label={t('showcase.setup.name')}
          required
          fullWidth
          autoFocus
          {...fieldError(form.formState.errors.name)}
        />
        <TextField
          {...form.register('description')}
          label={t('showcase.setup.description')}
          fullWidth
          multiline
          rows={DESCRIPTION_ROWS}
          {...fieldError(form.formState.errors.description)}
        />
      </Stack>
    </AppModal>
  );
};
