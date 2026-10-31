'use client';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { LazyRichTextEditor } from '@/components/common/rich-text/LazyRichTextEditor';

import type { BulkAnnouncementState } from './bulk-form';
import type { FC } from 'react';

interface BulkAnnouncementFormProps {
  form: BulkAnnouncementState;
  onChange: (key: keyof BulkAnnouncementState, value: string) => void;
}

const EDITOR_MIN_HEIGHT = 160;
const TITLE_MAX = 200;

/** "Post Announcement" tab: one announcement posted to every selected course. */
export const BulkAnnouncementForm: FC<BulkAnnouncementFormProps> = ({ form, onChange }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        size="small"
        fullWidth
        required
        label={t('adminCourses.bulk.announcementTitle')}
        placeholder={t('adminCourses.bulk.announcementTitlePlaceholder')}
        value={form.title}
        onChange={(event) => {
          onChange('title', event.target.value);
        }}
        slotProps={{ htmlInput: { maxLength: TITLE_MAX } }}
        sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
      />
      <LazyRichTextEditor
        label={t('adminCourses.bulk.announcementDescription')}
        placeholder={t('adminCourses.bulk.announcementDescriptionPlaceholder')}
        value={form.description}
        onChange={(html) => {
          onChange('description', html);
        }}
        minHeight={EDITOR_MIN_HEIGHT}
      />
    </Box>
  );
};
