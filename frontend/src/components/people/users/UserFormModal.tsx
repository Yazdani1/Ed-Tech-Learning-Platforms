'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useCreateUser, useUpdateUser } from '@/api/people.api';
import { AppModal } from '@/components/common/AppModal';
import {
  userCreateSchema,
  userEditSchema,
  type ManagedUser,
  type UserEditForm,
} from '@/schemas/people.schema';

import { UserFormFields } from './UserFormFields';

import type { FC } from 'react';

interface UserFormModalProps {
  open: boolean;
  /** The user being edited; undefined to create one */
  user: ManagedUser | undefined;
  onClose: () => void;
}

const EMPTY: UserEditForm = { name: '', email: '', password: '', role: 'Student' };

/** Create a user, or edit name, email, role and (optionally) password. */
export const UserFormModal: FC<UserFormModalProps> = ({ open, user, onClose }) => {
  const { t } = useTranslation();
  const create = useCreateUser();
  const update = useUpdateUser();
  const form = useForm<UserEditForm>({
    resolver: zodResolver(user ? userEditSchema : userCreateSchema),
    defaultValues: EMPTY,
  });
  const { reset } = form;
  const { reset: resetCreate } = create;
  const { reset: resetUpdate } = update;
  const mutation = user ? update : create;

  useEffect(() => {
    if (!open) return;
    reset(user ? { name: user.name, email: user.email, password: '', role: user.role } : EMPTY);
    resetCreate();
    resetUpdate();
  }, [open, user, reset, resetCreate, resetUpdate]);

  const onSave = form.handleSubmit((values) => {
    const { password, ...rest } = values;
    const request = user
      ? update.mutateAsync({ userId: user._id, body: password ? { ...rest, password } : rest })
      : create.mutateAsync(values);
    void request
      .then(() => {
        toast.success(t(user ? 'people.users.updated' : 'people.users.created'));
        onClose();
      })
      // The error is shown in the form (mutation.error)
      .catch(() => undefined);
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t(user ? 'people.users.editTitle' : 'people.users.createTitle')}
      onSave={() => void onSave()}
      saveLabel={user ? t('common.save') : t('common.create')}
      saving={mutation.isPending}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {mutation.error && <Alert severity="error">{mutation.error.message}</Alert>}
        <UserFormFields form={form} isEdit={user !== undefined} />
      </Stack>
    </AppModal>
  );
};
