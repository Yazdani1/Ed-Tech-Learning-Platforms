'use client';

import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import { needsStaffAnswer } from './qa-utils';

import type { CourseQuestion } from '@/schemas/people.schema';
import type { FC } from 'react';

interface QuestionStatusChipsProps {
  question: CourseQuestion;
}

/** Open / Solved, plus "Needs staff answer" when no staff member answered an open question. */
export const QuestionStatusChips: FC<QuestionStatusChipsProps> = ({ question }) => {
  const { t } = useTranslation();
  return (
    <>
      <Chip
        icon={question.isResolved ? <CheckCircleOutlinedIcon /> : <HelpOutlinedIcon />}
        label={t(question.isResolved ? 'people.qa.solved' : 'people.qa.open')}
        size="small"
        color={question.isResolved ? 'success' : 'default'}
        variant={question.isResolved ? 'filled' : 'outlined'}
      />
      {needsStaffAnswer(question) && (
        <Chip
          icon={<ErrorOutlinedIcon />}
          label={t('people.qa.needsStaffAnswer')}
          size="small"
          color="warning"
        />
      )}
    </>
  );
};
