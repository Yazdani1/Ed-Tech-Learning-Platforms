'use client';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import Typography from '@mui/material/Typography';

import type { FilterOption } from '@/components/common/FilterSelect';
import type { FC } from 'react';

interface PlanMultiSelectProps {
  /** Legend of the group ("Allowed plans") */
  legend: string;
  plans: readonly FilterOption[];
  /** The checked plan names */
  value: readonly string[];
  onChange: (plans: string[]) => void;
  /** Shown when there is no plan to pick */
  emptyText?: string;
}

/** Checkboxes of the subscription plans whose subscribers get a course (course editor and bulk edit). */
export const PlanMultiSelect: FC<PlanMultiSelectProps> = ({
  legend,
  plans,
  value,
  onChange,
  emptyText,
}) => {
  const toggle = (plan: string, on: boolean): void => {
    const rest = value.filter((item) => item !== plan);
    onChange(on ? [...rest, plan] : rest);
  };

  return (
    <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, mt: 1 }}>
      <FormLabel component="legend">{legend}</FormLabel>
      {plans.length === 0 && emptyText && (
        <Typography variant="body2" color="text.secondary">
          {emptyText}
        </Typography>
      )}
      <FormGroup row>
        {plans.map((plan) => (
          <FormControlLabel
            key={plan.value}
            label={plan.label}
            sx={{ minHeight: 44 }}
            control={
              <Checkbox
                checked={value.includes(plan.value)}
                onChange={(event) => {
                  toggle(plan.value, event.target.checked);
                }}
              />
            }
          />
        ))}
      </FormGroup>
    </Box>
  );
};
