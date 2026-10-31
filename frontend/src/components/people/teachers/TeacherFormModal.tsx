'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useSaveTeacher } from '@/api/people.api';
import { AppModal } from '@/components/common/AppModal';
import { teacherFormSchema, type ManagedUser, type TeacherForm } from '@/schemas/people.schema';
import { type AdminTeacher } from '@/schemas/public.schema';

import { TeacherAccountSelect } from './TeacherAccountSelect';
import { TeacherImagePicker } from './TeacherImagePicker';
import { TeacherTextFields } from './TeacherTextFields';
import { toTeacherForm, toTeacherFormData } from './teacher-utils';

import type { FC } from 'react';

interface TeacherFormModalProps {
  open: boolean;
  /** The profile being edited; undefined to add one */
  teacher: AdminTeacher | undefined;
  /** Teacher accounts not linked to another profile */
  linkableUsers: ManagedUser[];
  onClose: () => void;
}

/** Add or edit a teacher profile (photo, expertise, social links JSON, linked Teacher account). */
export const TeacherFormModal: FC<TeacherFormModalProps> = ({
  open,
  teacher,
  linkableUsers,
  onClose,
}) => {
  const { t } = useTranslation();
  const save = useSaveTeacher();
  const [image, setImage] = useState<File | null>(null);
  const form = useForm<TeacherForm>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: toTeacherForm(undefined),
  });
  const name = useWatch({ control: form.control, name: 'name' });
  const { reset } = form;
  const { reset: resetSave } = save;

  useEffect(() => {
    if (!open) return;
    reset(toTeacherForm(teacher));
    resetSave();
  }, [open, teacher, reset, resetSave]);

  // The chosen photo is cleared on close, so the next opening starts without one
  const close = (): void => {
    setImage(null);
    onClose();
  };

  const onSave = form.handleSubmit((values) => {
    void save
      .mutateAsync({ teacherId: teacher?._id, body: toTeacherFormData(values, image) })
      .then(() => {
        toast.success(t(teacher ? 'people.teachers.updated' : 'people.teachers.created'));
        close();
      })
      .catch(() => undefined);
  });

  return (
    <AppModal
      open={open}
      onClose={close}
      title={t(teacher ? 'people.teachers.editTitle' : 'people.teachers.addTitle')}
      onSave={() => void onSave()}
      saveLabel={t('common.save')}
      saving={save.isPending}
      maxWidth="md"
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {save.error && <Alert severity="error">{save.error.message}</Alert>}
        <TeacherTextFields form={form} />
        <TeacherAccountSelect form={form} linkableUsers={linkableUsers} />
        <TeacherImagePicker
          currentUrl={teacher?.profileImage}
          file={image}
          onChange={setImage}
          initial={name.trim().charAt(0).toUpperCase() || 'T'}
        />
      </Stack>
    </AppModal>
  );
};
