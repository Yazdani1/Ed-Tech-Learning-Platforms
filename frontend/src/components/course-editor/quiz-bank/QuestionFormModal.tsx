'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';
import { useFieldError } from '@/hooks/useFieldError';
import {
  emptyQuestionForm,
  OPTION_COUNT,
  questionFormSchema,
  type QuestionForm,
} from '@/schemas/course-editor.schema';

import { QuestionOptionFields } from './QuestionOptionFields';

import type { FC } from 'react';
import { type QuizQuestion } from '@/schemas/quiz.schema';

interface QuestionFormModalProps {
  open: boolean;
  /** The question being edited; undefined to add one */
  question: QuizQuestion | undefined;
  saving: boolean;
  onClose: () => void;
  onSave: (values: QuestionForm) => void;
}

const QUESTION_ROWS = 2;
const OPTION_INDEXES = Array.from({ length: OPTION_COUNT }, (_, index) => index);

const toForm = (question: QuizQuestion | undefined): QuestionForm => {
  if (!question) return emptyQuestionForm();
  return {
    question: question.question,
    options: OPTION_INDEXES.map((index) => ({
      text: question.options[index]?.text ?? '',
      explanation: question.options[index]?.explanation ?? '',
    })),
    correctOptionIndices: question.correctOptionIndices ?? [],
  };
};

/** Add or edit a question: text, 4 options with explanations, one or more correct answers. */
export const QuestionFormModal: FC<QuestionFormModalProps> = ({
  open,
  question,
  saving,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const form = useForm<QuestionForm>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: toForm(question),
  });
  const { reset, formState } = form;
  const correctError = formState.errors.correctOptionIndices?.message;

  useEffect(() => {
    if (open) reset(toForm(question));
  }, [open, question, reset]);

  const submit = form.handleSubmit(onSave);

  return (
    <AppModal
      open={open}
      title={t(question ? 'catalog.quiz.editQuestion' : 'catalog.quiz.addQuestion')}
      onClose={onClose}
      onSave={() => void submit()}
      saveLabel={question ? t('common.save') : t('catalog.quiz.addQuestion')}
      saving={saving}
      maxWidth="md"
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <TextField
          {...form.register('question')}
          label={t('catalog.quiz.questionText')}
          required
          fullWidth
          multiline
          minRows={QUESTION_ROWS}
          autoFocus
          {...fieldError(formState.errors.question)}
        />
        <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 700 }}>
          {t('catalog.quiz.options')}{' '}
          <Typography component="span" variant="caption" color="text.secondary">
            {t('catalog.quiz.optionsHint')}
          </Typography>
        </Typography>
        {correctError && <Alert severity="error">{t(correctError)}</Alert>}
        {OPTION_INDEXES.map((index) => (
          <QuestionOptionFields key={index} form={form} index={index} />
        ))}
      </Stack>
    </AppModal>
  );
};
