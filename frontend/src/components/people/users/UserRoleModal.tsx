'use client';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useUpdateUserRole } from '@/api/people.api';
import { AppModal } from '@/components/common/AppModal';

import { RoleSelect } from './RoleSelect';

import type { ManagedUser } from '@/schemas/people.schema';
import type { UserRole } from '@/types';
import type { FC } from 'react';

interface UserRoleModalProps {
  open: boolean;
  user: ManagedUser | undefined;
  onClose: () => void;
}

interface RoleForm {
  role: UserRole;
}

/** Change only the role of a user (the backend keeps at least one Super Admin). */
export const UserRoleModal: FC<UserRoleModalProps> = ({ open, user, onClose }) => {
  const { t } = useTranslation();
  const updateRole = useUpdateUserRole();
  const form = useForm<RoleForm>({ defaultValues: { role: 'Student' } });
  const { reset } = form;
  const { reset: resetMutation } = updateRole;
  const role = useWatch({ control: form.control, name: 'role' });

  useEffect(() => {
    if (!open || !user) return;
    reset({ role: user.role });
    resetMutation();
  }, [open, user, reset, resetMutation]);

  const onSave = form.handleSubmit((values) => {
    if (!user) return;
    void updateRole
      .mutateAsync({ userId: user._id, role: values.role })
      .then(() => {
        toast.success(t('people.users.roleUpdated'));
        onClose();
      })
      .catch(() => undefined);
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t('people.users.changeRole')}
      onSave={() => void onSave()}
      saveLabel={t('common.save')}
      saving={updateRole.isPending}
      saveDisabled={role === user?.role}
      maxWidth="xs"
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {updateRole.error && <Alert severity="error">{updateRole.error.message}</Alert>}
        <Typography variant="body2" color="text.secondary">
          {t('people.users.changeRoleFor', { name: user?.name ?? '' })}
        </Typography>
        <Controller
          control={form.control}
          name="role"
          render={({ field }) => <RoleSelect value={field.value} onChange={field.onChange} />}
        />
      </Stack>
    </AppModal>
  );
};
