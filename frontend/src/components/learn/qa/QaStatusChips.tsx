'use client';

import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import { needsStaffAnswer } from './qa.utils';

import type { QaQuestion } from '@/schemas/learn.schema';
import type { FC } from 'react';

interface QaStatusChipsProps {
  question: QaQuestion;
}

/** "Solved" / "Open", plus "Needs staff answer" for open questions without a staff answer. */
export const QaStatusChips: FC<QaStatusChipsProps> = ({ question }) => {
  const { t } = useTranslation();
  return (
    <>
      <Chip
        icon={question.isResolved ? <CheckCircleOutlinedIcon /> : <HelpOutlinedIcon />}
        label={t(question.isResolved ? 'learn.qa.solved' : 'learn.qa.open')}
        size="small"
        color={question.isResolved ? 'success' : 'default'}
        variant={question.isResolved ? 'filled' : 'outlined'}
        sx={{ fontWeight: 700 }}
      />
      {needsStaffAnswer(question) && (
        <Chip
          icon={<ErrorOutlinedIcon />}
          label={t('learn.qa.needsStaff')}
          size="small"
          color="warning"
          sx={{ fontWeight: 700 }}
        />
      )}
    </>
  );
};
