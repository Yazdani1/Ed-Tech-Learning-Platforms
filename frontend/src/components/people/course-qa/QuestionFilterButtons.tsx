'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import { QUESTION_FILTERS, type QuestionFilter } from './qa-utils';

import type { FC } from 'react';

interface QuestionFilterButtonsProps {
  value: QuestionFilter;
  counts: Record<QuestionFilter, number>;
  onChange: (filter: QuestionFilter) => void;
}

/** Not resolved yet / All questions / Not answered yet / Already resolved, each with its count. */
export const QuestionFilterButtons: FC<QuestionFilterButtonsProps> = ({
  value,
  counts,
  onChange,
}) => {
  const { t } = useTranslation();
  return (
    <Box
      role="group"
      aria-label={t('people.qa.filterLabel')}
      sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}
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
          sx={{ minHeight: 44 }}
        >
          {t(`people.qa.filters.${key}`, { count: counts[key] })}
        </Button>
      ))}
    </Box>
  );
};
