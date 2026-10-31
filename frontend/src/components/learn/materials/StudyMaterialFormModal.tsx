'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useSaveContent } from '@/api/learn.api';
import { AppModal } from '@/components/common/AppModal';
import {
  studyMaterialRequestSchema,
  type StudyMaterial,
  type StudyMaterialRequest,
} from '@/schemas/learn.schema';

import { StudyMaterialFields } from './StudyMaterialFields';

import type { FC } from 'react';

interface StudyMaterialFormModalProps {
  courseId: string;
  open: boolean;
  /** The material being edited; undefined to add a new one */
  item: StudyMaterial | undefined;
  onClose: () => void;
}

/** Add or edit a study material: title, rich text and an optional http(s) resource link. */
export const StudyMaterialFormModal: FC<StudyMaterialFormModalProps> = ({
  courseId,
  open,
  item,
  onClose,
}) => {
  const { t } = useTranslation();
  const save = useSaveContent('materials', courseId);
  const form = useForm<StudyMaterialRequest>({
    resolver: zodResolver(studyMaterialRequestSchema),
    defaultValues: { title: '', description: '', fileUrl: '' },
  });
  const { reset } = form;
  const { reset: resetMutation } = save;

  useEffect(() => {
    if (!open) return;
    reset({
      title: item?.title ?? '',
      description: item?.description ?? '',
      fileUrl: item?.fileUrl ?? '',
    });
    resetMutation();
  }, [open, item, reset, resetMutation]);

  // An empty link is sent as '' so an edit can remove it (the server clears the field)
  const onSave = form.handleSubmit(async (body) => {
    await save.mutateAsync({ id: item?._id, body }).then(
      () => {
        toast.success(t(item ? 'learn.materials.updated' : 'learn.materials.added'));
        onClose();
      },
      () => undefined,
    );
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t(item ? 'learn.materials.edit' : 'learn.materials.new')}
      onSave={() => void onSave()}
      saveLabel={item ? t('common.update') : t('common.add')}
      saving={save.isPending}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {save.error && <Alert severity="error">{save.error.message}</Alert>}
        <StudyMaterialFields form={form} />
      </Stack>
    </AppModal>
  );
};
