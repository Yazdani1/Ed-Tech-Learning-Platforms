'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { UploadedImageField } from './UploadedImageField';

import type { Benefit } from '@/schemas/course-extras.schema';
import type { FC } from 'react';

interface BenefitItemEditorProps {
  courseId: string;
  index: number;
  item: Benefit;
  onChange: (item: Benefit) => void;
  onRemove: () => void;
}

const TITLE_MAX = 150;
const DESCRIPTION_MAX = 2000;

/** One "What you get" card being edited: logo (uploaded at once), title, description. */
export const BenefitItemEditor: FC<BenefitItemEditorProps> = ({
  courseId,
  index,
  item,
  onChange,
  onRemove,
}) => {
  const { t } = useTranslation();
  const number = index + 1;

  return (
    <Paper variant="outlined" sx={{ p: 2, position: 'relative' }}>
      <IconButton
        aria-label={t('catalog.extras.benefits.remove', { number })}
        onClick={onRemove}
        sx={{ position: 'absolute', top: 6, right: 6 }}
      >
        <DeleteOutlineIcon />
      </IconButton>
      <Stack spacing={2} sx={{ pr: 5 }}>
        <UploadedImageField
          courseId={courseId}
          label={t('catalog.extras.chooseLogo')}
          image={item.icon}
          onChange={(icon) => {
            onChange({ ...item, icon });
          }}
        />
        <TextField
          label={t('catalog.extras.itemTitle', { number })}
          value={item.title}
          required
          onChange={(event) => {
            onChange({ ...item, title: event.target.value });
          }}
          slotProps={{ htmlInput: { maxLength: TITLE_MAX } }}
          fullWidth
        />
        <TextField
          label={t('catalog.extras.itemDescription')}
          value={item.description}
          onChange={(event) => {
            onChange({ ...item, description: event.target.value });
          }}
          slotProps={{ htmlInput: { maxLength: DESCRIPTION_MAX } }}
          fullWidth
          multiline
          minRows={2}
        />
      </Stack>
    </Paper>
  );
};
