'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import Typography from '@mui/material/Typography';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { BillingOptionRow } from './BillingOptionRow';

import type { PlanForm } from '@/schemas/people.schema';
import type { FC } from 'react';

interface PlanBillingFieldsProps {
  form: UseFormReturn<PlanForm>;
}

/** The plan's billing options: label, months and price per row; add and remove rows (at least one). */
export const PlanBillingFields: FC<PlanBillingFieldsProps> = ({ form }) => {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'billingOptions',
  });
  const rootError = form.formState.errors.billingOptions?.root?.message;

  return (
    <Box>
      <Typography variant="subtitle2" component="h3" sx={{ mb: 1, fontWeight: 700 }}>
        {t('people.plans.billingOptions')}
      </Typography>
      {fields.map((field, index) => (
        <BillingOptionRow
          key={field.id}
          form={form}
          index={index}
          canRemove={fields.length > 1}
          onRemove={() => {
            remove(index);
          }}
        />
      ))}
      {rootError && <FormHelperText error>{t(rootError)}</FormHelperText>}
      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={() => {
          append({ label: '', duration: '1', price: '' });
        }}
        sx={{ minHeight: 44 }}
      >
        {t('people.plans.addOption')}
      </Button>
    </Box>
  );
};
