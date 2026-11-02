'use client';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

export interface SectionIntro {
  title: string;
  description: string;
}

interface SectionIntroFieldsProps {
  value: SectionIntro;
  onChange: (value: SectionIntro) => void;
  /** Placeholder of the title (the heading the course page uses when it is empty) */
  titlePlaceholder: string;
}

const TITLE_MAX = 150;
const DESCRIPTION_MAX = 2000;
const DESCRIPTION_ROWS = 3;

/** The title and description shown above a section's cards on the course page. */
export const SectionIntroFields: FC<SectionIntroFieldsProps> = ({
  value,
  onChange,
  titlePlaceholder,
}) => {
  const { t } = useTranslation();
  return (
    <Stack spacing={2}>
      <TextField
        label={t('catalog.extras.sectionTitle')}
        placeholder={titlePlaceholder}
        value={value.title}
        onChange={(event) => {
          onChange({ ...value, title: event.target.value });
        }}
        slotProps={{ htmlInput: { maxLength: TITLE_MAX } }}
        fullWidth
      />
      <TextField
        label={t('catalog.extras.sectionDescription')}
        value={value.description}
        onChange={(event) => {
          onChange({ ...value, description: event.target.value });
        }}
        slotProps={{ htmlInput: { maxLength: DESCRIPTION_MAX } }}
        fullWidth
        multiline
        minRows={DESCRIPTION_ROWS}
      />
    </Stack>
  );
};
