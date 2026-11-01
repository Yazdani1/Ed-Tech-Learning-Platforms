'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import SaveIcon from '@mui/icons-material/Save';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useUpdatePointRules } from '@/api/community.api';
import { useToastResult } from '@/hooks/useToastResult';
import {
  pointRulesFormSchema,
  type PointRule,
  type PointRulesForm as PointRulesFormValues,
} from '@/schemas/community.schema';

import type { FC } from 'react';

interface PointRulesFormProps {
  rules: PointRule[];
}

/** Points per rule (accepted answer, new post, reply, reaction received): whole numbers of 0 or more. */
export const PointRulesForm: FC<PointRulesFormProps> = ({ rules }) => {
  const { t } = useTranslation();
  const update = useUpdatePointRules();
  const toastResult = useToastResult();
  const { control, register, handleSubmit, formState } = useForm<PointRulesFormValues>({
    resolver: zodResolver(pointRulesFormSchema),
    defaultValues: {
      rules: rules.map((rule) => ({
        key: rule.key,
        label: rule.label,
        points: String(rule.points),
      })),
    },
  });
  const { fields } = useFieldArray({ control, name: 'rules' });

  const save = handleSubmit(async (values) => {
    const body = values.rules.map((rule) => ({ key: rule.key, points: Number(rule.points) }));
    await toastResult(update.mutateAsync(body), t('community.admin.pointsSaved'));
  });

  return (
    <Stack component="form" noValidate spacing={2} onSubmit={(event) => void save(event)}>
      {fields.map((field, index) => {
        const message = formState.errors.rules?.[index]?.points?.message;
        return (
          <TextField
            key={field.id}
            {...register(`rules.${index}.points`)}
            label={t(`community.admin.rules.${field.key}`)}
            type="number"
            slotProps={{ htmlInput: { min: 0, inputMode: 'numeric' } }}
            error={message !== undefined}
            helperText={message ? t(message) : undefined}
          />
        );
      })}
      <Button
        type="submit"
        variant="contained"
        startIcon={<SaveIcon />}
        disabled={update.isPending}
        sx={{ alignSelf: 'flex-start', minHeight: 44 }}
      >
        {t('community.admin.savePoints')}
      </Button>
    </Stack>
  );
};
