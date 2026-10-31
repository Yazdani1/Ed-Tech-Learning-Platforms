'use client';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useTranslation } from 'react-i18next';

import { BULK_TABS, type BulkTab } from './bulk-form';
import { BulkAnnouncementForm } from './BulkAnnouncementForm';
import { BulkDiscountForm } from './BulkDiscountForm';
import { BulkFieldsForm } from './BulkFieldsForm';

import type { ReferenceOptions } from '../list/useReferenceOptions';
import type { BulkEditState } from './useBulkEdit';
import type { FC } from 'react';

interface BulkEditPanelProps {
  form: BulkEditState;
  options: ReferenceOptions;
  selectedCount: number;
}

/** Right side of the bulk dialog: the three tabs (fields, discount campaign, announcement). */
export const BulkEditPanel: FC<BulkEditPanelProps> = ({ form, options, selectedCount }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ minWidth: 0 }}>
      <Tabs
        value={form.tab}
        onChange={(_event, value: BulkTab) => {
          form.setTab(value);
        }}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label={t('adminCourses.bulk.tabs.label')}
        sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}
      >
        {BULK_TABS.map((tab) => (
          <Tab
            key={tab}
            value={tab}
            label={t(`adminCourses.bulk.tabs.${tab}`)}
            sx={{ minHeight: 48 }}
          />
        ))}
      </Tabs>
      <Box
        sx={{ p: { xs: 2, sm: 2.5 } }}
        role="tabpanel"
        aria-label={t(`adminCourses.bulk.tabs.${form.tab}`)}
      >
        {form.tab === 'fields' && (
          <BulkFieldsForm fields={form.fields} setField={form.setField} options={options} />
        )}
        {form.tab === 'discount' && (
          <BulkDiscountForm
            form={form.discount}
            onChange={form.setDiscount}
            selectedCount={selectedCount}
          />
        )}
        {form.tab === 'announcement' && (
          <BulkAnnouncementForm form={form.announcement} onChange={form.setAnnouncement} />
        )}
      </Box>
    </Box>
  );
};
