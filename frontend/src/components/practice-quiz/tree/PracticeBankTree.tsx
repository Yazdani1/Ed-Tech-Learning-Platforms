'use client';

import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { QueryState } from '@/components/common/QueryState';

import { treeBankCount } from '../practice-quiz.utils';

import { PracticeSectionAccordion } from './PracticeSectionAccordion';

import type { FC } from 'react';
import type { AnswerMap, Subsection } from '@/components/common/quiz/quiz.utils';
import type { PracticeTree } from '@/schemas/practice-quiz.schema';
import type { ApiError } from '@/services/http.service';

interface PracticeBankTreeProps {
  courseId: string | null;
  tree: PracticeTree | undefined;
  isLoading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  answers: AnswerMap;
  selectedBankId: string | null;
  subsection: Subsection;
  onSelect: (bankId: string, subsection: Subsection) => void;
  onReset: (bankId: string) => void;
}

/** The free-preview quiz sections of the chosen course, each with its banks. */
export const PracticeBankTree: FC<PracticeBankTreeProps> = ({
  courseId,
  tree,
  isLoading,
  error,
  onRetry,
  ...sectionProps
}) => {
  const { t } = useTranslation();
  const sections = tree?.sections ?? [];
  const padded = isLoading || error !== null;
  return (
    <Box component="section" aria-label={t('quiz.practice.tree.label')}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Typography component="h2" variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
          {tree?.course.title ?? t('quiz.practice.tree.title')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {tree
            ? t('quiz.practice.tree.bankCount', { count: treeBankCount(tree) })
            : t('quiz.practice.tree.selectCourse')}
        </Typography>
      </Box>
      {courseId === null ? (
        <Box sx={{ py: 8, px: 2, textAlign: 'center', color: 'text.secondary' }}>
          <MenuBookOutlinedIcon sx={{ fontSize: 42, opacity: 0.2 }} aria-hidden />
          <Typography variant="body2">{t('quiz.practice.tree.pickCourse')}</Typography>
        </Box>
      ) : (
        <Box sx={{ p: padded ? 1.5 : 0 }}>
          <QueryState
            isLoading={isLoading}
            error={error}
            onRetry={onRetry}
            isEmpty={sections.length === 0}
            emptyText={t('quiz.practice.tree.empty')}
            skeletonRows={3}
          >
            {sections.map((section) => (
              <PracticeSectionAccordion key={section._id} section={section} {...sectionProps} />
            ))}
          </QueryState>
        </Box>
      )}
    </Box>
  );
};
