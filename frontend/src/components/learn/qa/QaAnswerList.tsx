'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { QaAnswerItem } from './QaAnswerItem';

import type { QaAnswer } from '@/schemas/learn.schema';
import type { FC } from 'react';

interface QaAnswerListProps {
  courseId: string;
  questionId: string;
  answers: QaAnswer[];
  onEdit: (answer: QaAnswer) => void;
  /** "Add Answer" (everyone with course access may answer) */
  onAdd: () => void;
}

/** "Add Answer", "N Answers" and the answers, oldest first. */
export const QaAnswerList: FC<QaAnswerListProps> = ({
  courseId,
  questionId,
  answers,
  onEdit,
  onAdd,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={onAdd} sx={{ minHeight: 44 }}>
          {t('learn.qa.addAnswer')}
        </Button>
      </Box>
      <Typography component="h3" variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        {t('learn.qa.answers', { count: answers.length })}
      </Typography>
      {answers.length > 0 && (
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          {answers.map((answer, index) => (
            <QaAnswerItem
              key={answer._id}
              courseId={courseId}
              questionId={questionId}
              answer={answer}
              first={index === 0}
              onEdit={() => {
                onEdit(answer);
              }}
            />
          ))}
        </Paper>
      )}
    </>
  );
};
