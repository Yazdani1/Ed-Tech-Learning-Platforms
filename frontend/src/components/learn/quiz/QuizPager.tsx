'use client';

import Box from '@mui/material/Box';
import Pagination from '@mui/material/Pagination';
import PaginationItem from '@mui/material/PaginationItem';
import { useTranslation } from 'react-i18next';

import type { AnswerMap } from './quiz.utils';
import type { FC } from 'react';
import type { QuizQuestion } from '@/schemas/quiz.schema';

interface QuizPagerProps {
  questions: QuizQuestion[];
  answers: AnswerMap;
  /** Index of the current question */
  page: number;
  onChange: (page: number) => void;
}

/** One button per question; answered ones are green (correct) or red (wrong). */
export const QuizPager: FC<QuizPagerProps> = ({ questions, answers, page, onChange }) => {
  const { t } = useTranslation();
  if (questions.length <= 1) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
      <Pagination
        page={page + 1}
        count={questions.length}
        onChange={(_event, next) => {
          onChange(next - 1);
        }}
        shape="rounded"
        siblingCount={0}
        getItemAriaLabel={(type, itemPage) =>
          type === 'page'
            ? t('learn.quiz.goToQuestion', { number: itemPage })
            : t(`common.pagination.${type}`)
        }
        renderItem={(item) => {
          const answer =
            item.type === 'page' && item.page !== null
              ? answers.get(questions[item.page - 1]?._id ?? '')
              : undefined;
          const color = answer ? (answer.isCorrect ? 'success' : 'error') : undefined;
          return (
            <PaginationItem
              {...item}
              sx={{
                minWidth: 44,
                height: 44,
                ...(color && {
                  bgcolor: `${color}.main`,
                  color: 'common.white',
                  '&:hover': { bgcolor: `${color}.dark` },
                  '&.Mui-selected': {
                    bgcolor: `${color}.dark`,
                    outline: 3,
                    outlineColor: 'primary.main',
                  },
                }),
              }}
            />
          );
        }}
      />
    </Box>
  );
};
