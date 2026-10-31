'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Fragment, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { QuestionFilterButtons } from './QuestionFilterButtons';
import { QuestionRow } from './QuestionRow';
import { countQuestions, filterQuestions, type QuestionFilter } from './qa-utils';

import type { CourseQuestionGroup } from '@/schemas/people.schema';
import type { FC } from 'react';

interface CourseQuestionCardProps {
  group: CourseQuestionGroup;
}

/** One course: title, question count, filter buttons and its questions. */
export const CourseQuestionCard: FC<CourseQuestionCardProps> = ({ group }) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<QuestionFilter>('unresolved');
  const counts = useMemo(() => countQuestions(group.questions), [group.questions]);
  const shown = useMemo(() => filterQuestions(group.questions, filter), [group.questions, filter]);

  return (
    <Paper
      variant="outlined"
      component="section"
      aria-label={group.course.title}
      sx={{ overflow: 'hidden' }}
    >
      <Box
        sx={{ px: { xs: 2, sm: 2.5 }, py: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="h6"
            component="h2"
            sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}
          >
            {group.course.title}
          </Typography>
          {group.course.subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
              {group.course.subtitle}
            </Typography>
          )}
        </Box>
        <Chip
          label={t('people.qa.questionCount', { count: group.questions.length })}
          size="small"
          sx={{ fontWeight: 700, flexShrink: 0 }}
        />
      </Box>
      <Divider />
      <QuestionFilterButtons value={filter} counts={counts} onChange={setFilter} />
      <Divider />
      {shown.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, py: 3 }}>
          {t('people.qa.noneInFilter')}
        </Typography>
      ) : (
        shown.map((question, index) => (
          <Fragment key={question._id}>
            {index > 0 && <Divider />}
            <QuestionRow question={question} courseId={group.course._id} />
          </Fragment>
        ))
      )}
    </Paper>
  );
};
