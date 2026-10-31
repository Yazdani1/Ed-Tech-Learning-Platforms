'use client';

import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { PlanForm } from '@/schemas/people.schema';
import type { FC } from 'react';

interface PlanFeatureFieldsProps {
  form: UseFormReturn<PlanForm>;
}

/** The plan's feature lines (empty lines are dropped when saving). */
export const PlanFeatureFields: FC<PlanFeatureFieldsProps> = ({ form }) => {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'features' });

  return (
    <Box>
      <Typography variant="subtitle2" component="h3" sx={{ mb: 1, fontWeight: 700 }}>
        {t('people.plans.features')}
      </Typography>
      {fields.map((field, index) => (
        <Box key={field.id} sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField
            {...form.register(`features.${index}.value`)}
            label={t('people.plans.feature', { number: index + 1 })}
            size="small"
            fullWidth
          />
          <IconButton
            color="error"
            aria-label={t('people.plans.removeFeature', { number: index + 1 })}
            onClick={() => {
              remove(index);
            }}
            disabled={fields.length <= 1}
            sx={{ width: 44, height: 44 }}
          >
            <CancelIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={() => {
          append({ value: '' });
        }}
        sx={{ minHeight: 44 }}
      >
        {t('people.plans.addFeature')}
      </Button>
    </Box>
  );
};
