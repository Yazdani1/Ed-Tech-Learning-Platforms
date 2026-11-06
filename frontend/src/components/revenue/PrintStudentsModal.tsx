'use client';

import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';

import { PDF_FIELDS, type PdfField } from './order-export';
import { PdfFieldsGroup } from './PdfFieldsGroup';

import type { FC } from 'react';

export type PrintScope = 'selected' | 'filter';

interface PrintStudentsModalProps {
  onClose: () => void;
  selectedCount: number;
  /** "All courses" or the chosen course(s), for the "every order of ..." choice */
  filterLabel: string;
  printing: boolean;
  onPrint: (scope: PrintScope, fields: PdfField[]) => void;
}

const DEFAULT_FIELDS: readonly PdfField[] = ['name', 'studentNumber'];

/** (Mounted only while open.) Choose what to print (name, student ID, ...) and whose: the ticked orders or the filter. */
export const PrintStudentsModal: FC<PrintStudentsModalProps> = ({
  onClose,
  selectedCount,
  filterLabel,
  printing,
  onPrint,
}) => {
  const { t } = useTranslation();
  const [fields, setFields] = useState<PdfField[]>([...DEFAULT_FIELDS]);
  const [scope, setScope] = useState<PrintScope>(selectedCount > 0 ? 'selected' : 'filter');
  return (
    <AppModal
      open
      onClose={onClose}
      title={t('revenue.pdf.title')}
      onSave={() => {
        onPrint(
          scope,
          PDF_FIELDS.filter((field) => fields.includes(field)),
        );
      }}
      saveLabel={t('revenue.pdf.download')}
      saving={printing}
      saveDisabled={fields.length === 0}
    >
      <Stack spacing={3} sx={{ pt: 1 }}>
        <PdfFieldsGroup value={fields} onChange={setFields} />
        <RadioGroup
          value={scope}
          onChange={(event) => {
            setScope(event.target.value === 'selected' ? 'selected' : 'filter');
          }}
          aria-label={t('revenue.pdf.scopeLabel')}
        >
          <FormLabel sx={{ fontWeight: 700, mb: 1 }}>{t('revenue.pdf.scopeLabel')}</FormLabel>
          <FormControlLabel
            value="selected"
            control={<Radio />}
            disabled={selectedCount === 0}
            label={t('revenue.pdf.scopeSelected', { count: selectedCount })}
          />
          <FormControlLabel
            value="filter"
            control={<Radio />}
            label={t('revenue.pdf.scopeFilter', { filter: filterLabel })}
          />
        </RadioGroup>
        <Alert severity="info">{t('revenue.pdf.latinNote')}</Alert>
      </Stack>
    </AppModal>
  );
};
