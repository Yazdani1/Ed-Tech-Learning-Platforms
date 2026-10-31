'use client';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface QuizQuestionButtonsProps {
  /** The question was answered: "Next" instead of "Skip" + "Check Answer" */
  checked: boolean;
  canCheck: boolean;
  isLast: boolean;
  onCheck: () => void;
  onNext: () => void;
}

/** "Skip" and "Check Answer" before answering, "Next" after. */
export const QuizQuestionButtons: FC<QuizQuestionButtonsProps> = ({
  checked,
  canCheck,
  isLast,
  onCheck,
  onNext,
}) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2.5, justifyContent: 'flex-end' }}>
      {checked ? (
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={onNext}
          disabled={isLast}
          sx={{ minHeight: 44 }}
        >
          {t('common.next')}
        </Button>
      ) : (
        <>
          <Button
            variant="outlined"
            startIcon={<SkipNextIcon />}
            onClick={onNext}
            disabled={isLast}
            sx={{ minHeight: 44 }}
          >
            {t('learn.quiz.skip')}
          </Button>
          <Button variant="contained" onClick={onCheck} disabled={!canCheck} sx={{ minHeight: 44 }}>
            {t('learn.quiz.check')}
          </Button>
        </>
      )}
    </Box>
  );
};
