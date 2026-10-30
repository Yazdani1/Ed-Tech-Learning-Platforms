'use client';

import EventIcon from '@mui/icons-material/Event';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import type { FC, ReactNode } from 'react';

export type ContentView = 'recorded' | 'live' | 'quizzes';

interface ContentViewButtonsProps {
  view: ContentView;
  onChange: (view: ContentView) => void;
}

export const CONTENT_VIEWS: readonly ContentView[] = ['recorded', 'live', 'quizzes'];

const ICONS: Record<ContentView, ReactNode> = {
  recorded: <OndemandVideoIcon fontSize="small" />,
  live: <EventIcon fontSize="small" />,
  quizzes: <QuizOutlinedIcon fontSize="small" />,
};

/** "Recorded Lectures / Live Class / Quizzes" switch (pressed button = shown list). */
export const ContentViewButtons: FC<ContentViewButtonsProps> = ({ view, onChange }) => {
  const { t } = useTranslation();
  return (
    <Stack
      direction="row"
      role="group"
      aria-label={t('browse.content.views')}
      sx={{ gap: 1, mb: 2, flexWrap: 'wrap' }}
    >
      {CONTENT_VIEWS.map((item) => (
        <Button
          key={item}
          size="small"
          variant={view === item ? 'contained' : 'outlined'}
          aria-pressed={view === item}
          startIcon={ICONS[item]}
          onClick={() => {
            onChange(item);
          }}
          sx={{ minHeight: 44 }}
        >
          {t(`browse.content.${item}`)}
        </Button>
      ))}
    </Stack>
  );
};
