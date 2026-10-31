'use client';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { FilterSelect } from '@/components/common/FilterSelect';

import {
  BULK_GRID_SX,
  BULK_INPUT_SX,
  CLEAR_COURSE_TYPE,
  type BulkFieldsState,
  type SetBulkField,
} from './bulk-form';

import type { FilterOption } from '@/components/common/FilterSelect';
import type { ReferenceOptions } from '../list/useReferenceOptions';
import type { FC } from 'react';

interface BulkChoiceFieldsProps {
  fields: BulkFieldsState;
  setField: SetBulkField;
  options: ReferenceOptions;
}

type ChoiceKey = 'courseType' | 'category' | 'status' | 'visibility' | 'pricing';

/** Course type, category, status, visibility, pricing (+ price for Paid); each starts at "No change". */
export const BulkChoiceFields: FC<BulkChoiceFieldsProps> = ({ fields, setField, options }) => {
  const { t } = useTranslation();
  const choices: [key: ChoiceKey, options: FilterOption[]][] = [
    [
      'courseType',
      [
        { value: CLEAR_COURSE_TYPE, label: t('adminCourses.bulk.clearCourseType') },
        ...options.courseTypes,
      ],
    ],
    ['category', options.categories],
    ['status', options.statuses],
    ['visibility', options.visibilities],
    ['pricing', options.pricings],
  ];
  const update = (key: ChoiceKey, value: string): void => {
    setField(key, value);
  };

  return (
    <Box sx={BULK_GRID_SX}>
      {choices.map(([key, list]) => (
        <FilterSelect
          key={key}
          label={t(`adminCourses.filter.${key}`)}
          allLabel={t('adminCourses.bulk.noChange')}
          value={fields[key]}
          options={list}
          onChange={(value) => {
            update(key, value);
          }}
        />
      ))}
      {fields.pricing === 'Paid' && (
        <TextField
          size="small"
          type="number"
          label={t('adminCourses.bulk.price')}
          value={fields.price}
          onChange={(event) => {
            setField('price', event.target.value);
          }}
          slotProps={{ htmlInput: { min: 0, inputMode: 'decimal' } }}
          sx={BULK_INPUT_SX}
        />
      )}
    </Box>
  );
};
