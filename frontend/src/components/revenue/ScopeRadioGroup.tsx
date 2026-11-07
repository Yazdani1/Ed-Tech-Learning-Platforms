'use client';

import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import { useTranslation } from 'react-i18next';

import type { PrintScope } from './PrintStudentsModal';
import type { FC } from 'react';

interface ScopeRadioGroupProps {
  value: PrintScope;
  onChange: (scope: PrintScope) => void;
  selectedCount: number;
  selectedText: string;
  filterText: string;
}

/** "Whose details": the ticked rows (disabled when none) or every row of the current filter. */
export const ScopeRadioGroup: FC<ScopeRadioGroupProps> = ({
  value,
  onChange,
  selectedCount,
  selectedText,
  filterText,
}) => {
  const { t } = useTranslation();
  return (
    <RadioGroup
      value={value}
      onChange={(event) => {
        onChange(event.target.value === 'selected' ? 'selected' : 'filter');
      }}
      aria-label={t('revenue.pdf.scopeLabel')}
    >
      <FormLabel sx={{ fontWeight: 700, mb: 1 }}>{t('revenue.pdf.scopeLabel')}</FormLabel>
      <FormControlLabel
        value="selected"
        control={<Radio />}
        disabled={selectedCount === 0}
        label={selectedText}
      />
      <FormControlLabel value="filter" control={<Radio />} label={filterText} />
    </RadioGroup>
  );
};
