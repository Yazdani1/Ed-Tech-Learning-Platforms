'use client';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import { useTranslation } from 'react-i18next';

import { PDF_FIELDS, type PdfField } from './order-export';

import type { FC } from 'react';

interface PdfFieldsGroupProps {
  value: readonly PdfField[];
  onChange: (fields: PdfField[]) => void;
}

/** Tick boxes: which student details go into the PDF (name, student ID, email, phone, course). */
export const PdfFieldsGroup: FC<PdfFieldsGroupProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const toggle = (field: PdfField): void => {
    onChange(value.includes(field) ? value.filter((item) => item !== field) : [...value, field]);
  };
  return (
    <FormGroup>
      <FormLabel component="legend" sx={{ fontWeight: 700, mb: 1 }}>
        {t('revenue.pdf.fieldsLabel')}
      </FormLabel>
      {PDF_FIELDS.map((field) => (
        <FormControlLabel
          key={field}
          control={
            <Checkbox
              checked={value.includes(field)}
              onChange={() => {
                toggle(field);
              }}
            />
          }
          label={t(`revenue.pdf.fields.${field}`)}
        />
      ))}
    </FormGroup>
  );
};
