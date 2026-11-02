'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { DetailSection } from './DetailSection';

import type { CourseFaq } from '@/schemas/course-extras.schema';
import type { FC } from 'react';

interface CourseFaqSectionProps {
  faqs: readonly CourseFaq[];
}

/** Frequently asked questions: one accordion per question. */
export const CourseFaqSection: FC<CourseFaqSectionProps> = ({ faqs }) => {
  const { t } = useTranslation();
  if (faqs.length === 0) return null;
  return (
    <DetailSection id="course-faq" title={t('browse.extras.faqTitle')}>
      {faqs.map((faq, index) => (
        <Accordion
          key={`${faq.question}-${index}`}
          variant="outlined"
          disableGutters
          sx={{ '&:not(:last-of-type)': { borderBottom: 0 } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 48 }}>
            <Typography component="h3" sx={{ fontWeight: 700 }}>
              {faq.question}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
              {faq.answer}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </DetailSection>
  );
};
