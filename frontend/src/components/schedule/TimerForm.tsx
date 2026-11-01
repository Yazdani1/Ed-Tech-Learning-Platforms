'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import TimerIcon from '@mui/icons-material/Timer';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useCreateTimer } from '@/api/schedule.api';
import { useFieldError } from '@/hooks/useFieldError';
import { useToastResult } from '@/hooks/useToastResult';
import {
  durationToSeconds,
  timerFormSchema,
  type TimerForm as TimerFormValues,
} from '@/schemas/schedule.schema';

import { FormCardTitle } from './FormCardTitle';
import { FormSubmitButton } from './FormSubmitButton';
import { TimerDurationField } from './TimerDurationField';

const DEFAULT_MINUTES = 25;
const DEFAULT_VALUES: TimerFormValues = {
  title: '',
  description: '',
  duration: { hours: 0, minutes: DEFAULT_MINUTES, seconds: 0 },
};

/** "New Study Timer" card: title, description and a duration dial; the timer starts at once. */
export const TimerForm = () => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const createTimer = useCreateTimer();
  const toastResult = useToastResult();
  const form = useForm<TimerFormValues>({
    resolver: zodResolver(timerFormSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const { errors } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    const created = await toastResult(
      createTimer.mutateAsync({
        title: values.title,
        description: values.description,
        duration: durationToSeconds(values.duration),
      }),
      t('schedule.timer.created'),
    );
    if (created) form.reset(DEFAULT_VALUES);
  });

  return (
    <Card variant="outlined">
      <CardContent>
        <FormCardTitle icon={<TimerIcon color="primary" aria-hidden />}>
          {t('schedule.timer.newTitle')}
        </FormCardTitle>
        <Box component="form" noValidate onSubmit={(event) => void submit(event)}>
          <TextField
            {...form.register('title')}
            label={t('schedule.form.titleLabel')}
            placeholder={t('schedule.timer.titlePlaceholder')}
            required
            fullWidth
            sx={{ mb: 2 }}
            {...fieldError(errors.title)}
          />
          <TextField
            {...form.register('description')}
            label={t('schedule.form.descriptionLabel')}
            placeholder={t('schedule.timer.descriptionPlaceholder')}
            fullWidth
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <TimerDurationField control={form.control} errorKey={errors.duration?.message} />
          <FormSubmitButton
            pending={createTimer.isPending}
            label={t('schedule.timer.submit')}
            pendingLabel={t('schedule.timer.creating')}
          />
        </Box>
      </CardContent>
    </Card>
  );
};
