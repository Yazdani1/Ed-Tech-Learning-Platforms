'use client';

import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Switch from '@mui/material/Switch';
import { useTranslation } from 'react-i18next';

import { PlanMultiSelect } from '@/components/course-fields/PlanMultiSelect';

import type { BulkFieldsState, SetBulkField } from './bulk-form';
import type { FilterOption } from '@/components/common/FilterSelect';
import type { FC } from 'react';

interface BulkSubscriptionFieldProps {
  fields: BulkFieldsState;
  setField: SetBulkField;
  plans: FilterOption[];
}

/** Include in subscription + allowed plans (sent only once touched). */
export const BulkSubscriptionField: FC<BulkSubscriptionFieldProps> = ({
  fields,
  setField,
  plans,
}) => {
  const { t } = useTranslation();

  return (
    <Box component="fieldset" sx={{ border: 0, p: 0, m: 0 }}>
      <FormLabel component="legend" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
        {t('adminCourses.bulk.subscription')}
      </FormLabel>
      <FormControlLabel
        control={
          <Switch
            checked={fields.subscriptionIncluded}
            onChange={(event) => {
              setField('subscriptionIncluded', event.target.checked);
              setField('subscriptionEdited', true);
            }}
          />
        }
        label={t('adminCourses.bulk.includeInSubscription')}
        sx={{ minHeight: 44 }}
      />
      {fields.subscriptionIncluded && plans.length > 0 && (
        <PlanMultiSelect
          legend={t('adminCourses.bulk.allowedPlans')}
          plans={plans}
          value={fields.subscriptionPlans}
          onChange={(next) => {
            setField('subscriptionPlans', next);
            setField('subscriptionEdited', true);
          }}
        />
      )}
    </Box>
  );
};
