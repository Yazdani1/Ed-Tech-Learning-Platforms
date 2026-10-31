'use client';

import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { Controller, useWatch, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSubscriptionPlans } from '@/api/catalog.api';
import { PlanMultiSelect } from '@/components/course-fields/PlanMultiSelect';

import type { CourseDetailsForm } from '@/schemas/course-editor.schema';
import type { FC } from 'react';

interface SubscriptionFieldProps {
  control: Control<CourseDetailsForm>;
}

/** "Included in Subscription" switch and, when on, the plans whose subscribers get the course. */
export const SubscriptionField: FC<SubscriptionFieldProps> = ({ control }) => {
  const { t } = useTranslation();
  const plans = useSubscriptionPlans();
  const included = useWatch({ control, name: 'includedInSubscription' });
  const options = (plans.data ?? []).map(({ plan }) => ({ value: plan, label: plan }));

  return (
    <Box>
      <Controller
        control={control}
        name="includedInSubscription"
        render={({ field }) => (
          <FormControlLabel
            control={
              <Switch
                checked={field.value}
                onChange={(event) => {
                  field.onChange(event.target.checked);
                }}
              />
            }
            label={t('catalog.basic.includedInSubscription')}
            sx={{ minHeight: 44 }}
          />
        )}
      />
      {included && (
        <Controller
          control={control}
          name="allowedSubscriptionPlans"
          render={({ field }) => (
            <PlanMultiSelect
              legend={t('catalog.basic.allowedPlans')}
              plans={options}
              value={field.value}
              onChange={field.onChange}
              emptyText={plans.isSuccess ? t('catalog.basic.noPlans') : undefined}
            />
          )}
        />
      )}
    </Box>
  );
};
