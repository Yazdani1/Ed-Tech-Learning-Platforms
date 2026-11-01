'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import SendIcon from '@mui/icons-material/Send';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useCreateChildReply } from '@/api/community.api';
import { RichTextField } from '@/components/common/rich-text/RichTextField';
import { useToastResult } from '@/hooks/useToastResult';
import { replyFormSchema, type ReplyForm } from '@/schemas/community.schema';

import { FormButtons } from '../common/FormButtons';

import type { FC } from 'react';

const EDITOR_MIN_HEIGHT = 120;

interface ChildReplyFormProps {
  replyId: string;
  /** Called with true after a successful post (the replies open), false on cancel */
  onDone: (posted: boolean) => void;
}

/** Reply to an answer (rich text, no pictures: the backend takes text only). */
export const ChildReplyForm: FC<ChildReplyFormProps> = ({ replyId, onDone }) => {
  const { t } = useTranslation();
  const create = useCreateChildReply();
  const toastResult = useToastResult();
  const { control, handleSubmit } = useForm<ReplyForm>({
    resolver: zodResolver(replyFormSchema),
    defaultValues: { body: '' },
  });

  const submit = handleSubmit(async ({ body }) => {
    if (await toastResult(create.mutateAsync({ id: replyId, body }), t('community.reply.added')))
      onDone(true);
  });

  return (
    <Paper elevation={0} sx={{ p: 1.5, border: 1, borderColor: 'divider' }}>
      <Stack component="form" noValidate spacing={1} onSubmit={(event) => void submit(event)}>
        <RichTextField
          control={control}
          name="body"
          label={t('community.reply.childEditorLabel')}
          placeholder={t('community.reply.childPlaceholder')}
          minHeight={EDITOR_MIN_HEIGHT}
          features="basic"
          showLabel={false}
        />
        <FormButtons
          submitLabel={t('community.reply.postReply')}
          onCancel={() => {
            onDone(false);
          }}
          busy={create.isPending}
          startIcon={<SendIcon />}
        />
      </Stack>
    </Paper>
  );
};
