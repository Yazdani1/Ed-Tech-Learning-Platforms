'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { DetailSection } from './DetailSection';

import type { CourseFaq } from '@/schemas/course-extras.schema';
import type { FC } from 'react';

/** The answer area's tint of the primary colour */
const ANSWER_TINT = 0.06;
const MAX_WIDTH = 880;

interface CourseFaqSectionProps {
  faqs: readonly CourseFaq[];
}

/** Frequently asked questions: centred title, one card per question; the open answer sits on a tinted band. */
export const CourseFaqSection: FC<CourseFaqSectionProps> = ({ faqs }) => {
  const { t } = useTranslation();
  if (faqs.length === 0) return null;
  return (
    <DetailSection id="course-faq" title={t('browse.extras.faqTitle')} centered>
      <Box sx={{ maxWidth: MAX_WIDTH, mx: 'auto', display: 'grid', gap: 1.5 }}>
        {faqs.map((faq, index) => (
          <Accordion
            key={`${faq.question}-${index}`}
            variant="outlined"
            disableGutters
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              '&::before': { display: 'none' },
              '&.Mui-expanded': { borderColor: 'primary.main' },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ minHeight: 56, px: { xs: 2, sm: 2.5 } }}
            >
              {/* The accordion heading slot is already an h3 */}
              <Typography component="span" sx={{ fontWeight: 700 }}>
                {faq.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={(theme) => ({
                bgcolor: alpha(theme.palette.primary.main, ANSWER_TINT),
                borderTop: 1,
                borderColor: 'divider',
                px: { xs: 2, sm: 2.5 },
                py: 2,
              })}
            >
              <Typography color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {faq.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </DetailSection>
  );
};
