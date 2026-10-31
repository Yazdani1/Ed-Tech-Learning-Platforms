'use client';

import Box from '@mui/material/Box';

import { BulkChoiceFields } from './BulkChoiceFields';
import { BulkDateFields } from './BulkDateFields';
import { BulkSubscriptionField } from './BulkSubscriptionField';
import { BulkTeachersField } from './BulkTeachersField';

import type { ReferenceOptions } from '../list/useReferenceOptions';
import type { BulkFieldsState, SetBulkField } from './bulk-form';
import type { FC } from 'react';

interface BulkFieldsFormProps {
  fields: BulkFieldsState;
  setField: SetBulkField;
  options: ReferenceOptions;
}

/** "Update Fields" tab: every field starts at "No change"; only the filled ones are sent. */
export const BulkFieldsForm: FC<BulkFieldsFormProps> = ({ fields, setField, options }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <BulkChoiceFields fields={fields} setField={setField} options={options} />
    <BulkSubscriptionField fields={fields} setField={setField} plans={options.plans} />
    <BulkTeachersField
      teacherIds={fields.teacherIds}
      teachers={options.teachers}
      onChange={(ids) => {
        setField('teacherIds', ids);
      }}
    />
    <BulkDateFields fields={fields} setField={setField} />
  </Box>
);
