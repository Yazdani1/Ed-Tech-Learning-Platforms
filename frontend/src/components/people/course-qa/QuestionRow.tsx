'use client';

import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { PostedByLine } from '@/components/common/PostedByLine';
import { useAuth } from '@/hooks/useAuth';
import { htmlToPlainText } from '@/utils/html-text';

import { QuestionStatusChips } from './QuestionStatusChips';
import { needsStaffAnswer, questionThreadPath } from './qa-utils';

import type { CourseQuestion } from '@/schemas/people.schema';
import type { FC } from 'react';

interface QuestionRowProps {
  question: CourseQuestion;
  courseId: string;
}

const PREVIEW_LINES = 2;

/** One question (a link to its thread in the course player): title, Open/Solved, "Needs staff answer", preview, author. */
export const QuestionRow: FC<QuestionRowProps> = ({ question, courseId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <ButtonBase
      component={Link}
      href={questionThreadPath(courseId, question._id)}
      aria-label={t('people.qa.openQuestion', { title: question.title })}
      sx={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        px: { xs: 2, sm: 2.5 },
        py: 2,
        bgcolor: needsStaffAnswer(question) ? 'rgba(237, 108, 2, 0.06)' : 'transparent',
        '&:hover, &.Mui-focusVisible': { bgcolor: 'action.hover' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.75 }}>
        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 800 }}>
          {question.title}
        </Typography>
        <QuestionStatusChips question={question} />
      </Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mb: 1.25,
          display: '-webkit-box',
          WebkitLineClamp: PREVIEW_LINES,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          overflowWrap: 'anywhere',
        }}
      >
        {htmlToPlainText(question.description)}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <PostedByLine
          postedBy={question.postedBy}
          createdAt={question.createdAt ?? undefined}
          userId={user?._id ?? ''}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
          <ForumOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} aria-hidden />
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            {t('people.qa.answerCount', { count: question.answerCount })}
          </Typography>
        </Box>
      </Box>
    </ButtonBase>
  );
};
