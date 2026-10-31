'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import { QUESTION_FILTERS, type QuestionFilter } from './qa.utils';

import type { FC } from 'react';

interface QaFilterBarProps {
  value: QuestionFilter;
  counts: Record<QuestionFilter, number>;
  onChange: (filter: QuestionFilter) => void;
}

/** "Not resolved yet / All / Not answered yet / Already resolved" with counts. */
export const QaFilterBar: FC<QaFilterBarProps> = ({ value, counts, onChange }) => {
  const { t } = useTranslation();
  return (
    <Box
      role="group"
      aria-label={t('learn.qa.filters')}
      sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}
    >
      {QUESTION_FILTERS.map((key) => (
        <Button
          key={key}
          size="small"
          variant={value === key ? 'contained' : 'outlined'}
          color={key === 'needsStaffAnswer' && value === key ? 'warning' : 'primary'}
          aria-pressed={value === key}
          onClick={() => {
            onChange(key);
          }}
          sx={{ minHeight: 44, fontWeight: 700 }}
        >
          {t(`learn.qa.filter.${key}`, { count: counts[key] })}
        </Button>
      ))}
    </Box>
  );
};
