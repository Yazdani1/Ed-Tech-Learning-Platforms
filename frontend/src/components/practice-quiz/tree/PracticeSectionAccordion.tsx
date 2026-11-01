'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { PracticeBankAccordion } from './PracticeBankAccordion';

import type { FC } from 'react';
import type { AnswerMap, Subsection } from '@/components/common/quiz/quiz.utils';
import type { PracticeSection } from '@/schemas/practice-quiz.schema';

interface PracticeSectionAccordionProps {
  section: PracticeSection;
  answers: AnswerMap;
  selectedBankId: string | null;
  subsection: Subsection;
  onSelect: (bankId: string, subsection: Subsection) => void;
  onReset: (bankId: string) => void;
}

/** A free-preview quiz section and its banks (opened when it holds the selected bank). */
export const PracticeSectionAccordion: FC<PracticeSectionAccordionProps> = ({
  section,
  answers,
  selectedBankId,
  subsection,
  onSelect,
  onReset,
}) => {
  const { t } = useTranslation();
  const hasSelected = section.banks.some((bank) => bank._id === selectedBankId);
  return (
    <Accordion
      defaultExpanded={hasSelected}
      disableGutters
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        borderLeft: 3,
        borderLeftColor: hasSelected ? 'primary.main' : 'transparent',
        '&::before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
          <Typography
            noWrap
            sx={{
              fontWeight: hasSelected ? 800 : 600,
              fontSize: '0.85rem',
              color: hasSelected ? 'primary.main' : 'text.primary',
            }}
          >
            {section.title}
          </Typography>
          {section.isFreePreview && (
            <Chip label={t('quiz.practice.tree.free')} size="small" color="success" />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0, pb: 0.5 }}>
        {section.banks.map((bank) => (
          <PracticeBankAccordion
            key={bank._id}
            bank={bank}
            inFreeSection={section.isFreePreview}
            answers={answers}
            selected={bank._id === selectedBankId ? subsection : null}
            onSelect={(next) => {
              onSelect(bank._id, next);
            }}
            onReset={() => {
              onReset(bank._id);
            }}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
};
