'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useSaveTool } from '@/api/tools.api';
import { AppModal } from '@/components/common/AppModal';
import { ImagePickField } from '@/components/common/ImagePickField';
import { useFieldError } from '@/hooks/useFieldError';
import { useImagePreview } from '@/hooks/useImagePreview';
import { toolFormSchema, type Tool, type ToolForm } from '@/schemas/tools.schema';

import type { FC } from 'react';

interface ToolFormModalProps {
  open: boolean;
  /** The tool being edited; undefined to add one */
  tool: Tool | undefined;
  onClose: () => void;
}

/** The name form, filled with the tool's name (or empty) each time the dialog opens. */
const useToolForm = (open: boolean, tool: Tool | undefined): UseFormReturn<ToolForm> => {
  const form = useForm<ToolForm>({
    resolver: zodResolver(toolFormSchema),
    defaultValues: { name: '' },
  });
  const { reset } = form;
  useEffect(() => {
    if (open) reset({ name: tool?.name ?? '' });
  }, [open, tool, reset]);
  return form;
};

/** Add or edit a tool: its name and logo (the logo is required for a new tool). */
export const ToolFormModal: FC<ToolFormModalProps> = ({ open, tool, onClose }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const save = useSaveTool();
  const [logo, setLogo] = useState<File | null>(null);
  const preview = useImagePreview(logo);
  const form = useToolForm(open, tool);
  const { reset: resetMutation } = save;

  useEffect(() => {
    if (open) resetMutation();
  }, [open, resetMutation]);

  // The picked logo is dropped whenever the dialog closes, so it opens empty next time
  const handleClose = (): void => {
    setLogo(null);
    onClose();
  };

  const onSave = form.handleSubmit(({ name }) => {
    save.mutate(
      { id: tool?._id, name, logo: logo ?? undefined },
      {
        onSuccess: () => {
          toast.success(t(`showcase.setup.tool.${tool ? 'updated' : 'created'}`));
          handleClose();
        },
      },
    );
  });

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title={t(`showcase.setup.tool.${tool ? 'edit' : 'add'}`)}
      onSave={() => void onSave()}
      saveLabel={tool ? t('common.update') : t('common.save')}
      saving={save.isPending}
      saveDisabled={!tool && !logo}
    >
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        {save.error && <Alert severity="error">{save.error.message}</Alert>}
        <TextField
          {...form.register('name')}
          label={t('showcase.setup.tool.name')}
          placeholder={t('showcase.setup.tool.namePlaceholder')}
          required
          fullWidth
          autoFocus
          {...fieldError(form.formState.errors.name)}
        />
        <ImagePickField
          label={t(tool ? 'showcase.setup.tool.changeLogo' : 'showcase.setup.tool.chooseLogo')}
          previewUrl={preview ?? tool?.logoUrl}
          onFile={setLogo}
          size={88}
        />
      </Stack>
    </AppModal>
  );
};
