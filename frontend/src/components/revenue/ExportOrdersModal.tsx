'use client';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';

import { ScopeRadioGroup } from './ScopeRadioGroup';

import type { PrintScope } from './PrintStudentsModal';
import type { FC } from 'react';

export interface ExportChoice {
  scope: PrintScope;
  includeContact: boolean;
}

interface ExportOrdersModalProps {
  onClose: () => void;
  selectedCount: number;
  /** "All courses", the chosen course(s) or "every enrolment shown (12)" */
  filterLabel: string;
  exporting: boolean;
  /** Email and phone ticked from the start (the course page exports every detail) */
  defaultIncludeContact?: boolean;
  /** Other wording for the two choices (e.g. students instead of orders) */
  selectedText?: string;
  filterText?: string;
  /** Lists that always hold the contact columns (users) have no email / phone choice */
  hideContactOption?: boolean;
  onExport: (choice: ExportChoice) => void;
}

/** (Mounted only while open.) CSV export: the ticked rows or every row of the filter; email and phone on request. */
export const ExportOrdersModal: FC<ExportOrdersModalProps> = ({
  onClose,
  selectedCount,
  filterLabel,
  exporting,
  defaultIncludeContact = false,
  selectedText,
  filterText,
  hideContactOption = false,
  onExport,
}) => {
  const { t } = useTranslation();
  const [scope, setScope] = useState<PrintScope>(selectedCount > 0 ? 'selected' : 'filter');
  const [includeContact, setIncludeContact] = useState(defaultIncludeContact);
  return (
    <AppModal
      open
      onClose={onClose}
      title={t('revenue.export.title')}
      onSave={() => {
        onExport({ scope, includeContact });
      }}
      saveLabel={t('revenue.export.download')}
      saving={exporting}
    >
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        <ScopeRadioGroup
          value={scope}
          onChange={setScope}
          selectedCount={selectedCount}
          selectedText={selectedText ?? t('revenue.pdf.scopeSelected', { count: selectedCount })}
          filterText={filterText ?? t('revenue.pdf.scopeFilter', { filter: filterLabel })}
        />
        {!hideContactOption && (
          <FormControlLabel
            control={
              <Checkbox
                checked={includeContact}
                onChange={(event) => {
                  setIncludeContact(event.target.checked);
                }}
              />
            }
            label={t('revenue.export.includeContact')}
          />
        )}
      </Stack>
    </AppModal>
  );
};
