'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import { useState } from 'react';

import { statsOf, type AnswerMap, type Subsection } from '@/components/common/quiz/quiz.utils';

import { PracticeBankDetails } from './PracticeBankDetails';
import { PracticeBankSummary } from './PracticeBankSummary';

import type { FC } from 'react';
import type { QuizBank } from '@/schemas/quiz.schema';

interface PracticeBankAccordionProps {
  bank: QuizBank;
  /** The section is free preview already (then the bank needs no "Free" chip of its own) */
  inFreeSection: boolean;
  answers: AnswerMap;
  /** The subsection shown when this bank is the selected one */
  selected: Subsection | null;
  onSelect: (subsection: Subsection) => void;
  onReset: () => void;
}

/** A bank: title, progress when folded, and its All / Wrong / Correct buttons plus reset when open. */
export const PracticeBankAccordion: FC<PracticeBankAccordionProps> = ({
  bank,
  inFreeSection,
  answers,
  selected,
  onSelect,
  onReset,
}) => {
  const [expanded, setExpanded] = useState(selected !== null);
  const stats = statsOf(bank.questions, answers);
  return (
    <Accordion
      component="article"
      aria-label={bank.title}
      expanded={expanded}
      onChange={(_event, open) => {
        setExpanded(open);
      }}
      disableGutters
      elevation={0}
      sx={{
        mx: 1.5,
        mb: 1.25,
        border: 1.5,
        borderStyle: 'solid',
        borderColor: selected ? 'primary.main' : 'divider',
        borderRadius: '8px !important',
        overflow: 'hidden',
        '&::before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />} sx={{ minHeight: 48 }}>
        <PracticeBankSummary
          bank={bank}
          stats={stats}
          showFreeChip={bank.isFreePreview && !inFreeSection}
          showProgress={!expanded && stats.answered > 0}
          selected={selected !== null}
        />
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1.5, pt: 0, pb: 1.25 }}>
        <PracticeBankDetails
          bank={bank}
          answers={answers}
          stats={stats}
          selected={selected}
          onSelect={onSelect}
          onReset={onReset}
        />
      </AccordionDetails>
    </Accordion>
  );
};
