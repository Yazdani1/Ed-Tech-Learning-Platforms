'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { QuizBankCard } from './QuizBankCard';

import type { AnswerMap } from './quiz.utils';
import type { QuizPractice } from './useQuizPractice';
import type { FC } from 'react';
import type { QuizBank, QuizSection } from '@/schemas/quiz.schema';

interface QuizSectionGroupProps {
  section: QuizSection;
  /** The banks of this section */
  banks: QuizBank[];
  defaultExpanded: boolean;
  answers: AnswerMap;
  practice: QuizPractice;
}

/** One quiz section as an accordion with its banks. */
export const QuizSectionGroup: FC<QuizSectionGroupProps> = ({
  section,
  banks,
  defaultExpanded,
  answers,
  practice,
}) => {
  const { t } = useTranslation();
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      elevation={0}
      disableGutters
      sx={{ borderBottom: 1, borderColor: 'divider', '&::before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 48 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{section.title}</Typography>
          {section.isFreePreview && (
            <Chip label={t('learn.quiz.freePreview')} size="small" color="success" />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        {banks.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            {t('learn.quiz.noBanks')}
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            {banks.map((bank) => (
              <QuizBankCard key={bank._id} bank={bank} answers={answers} practice={practice} />
            ))}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
};
