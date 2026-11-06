'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CARD_RADIUS, SOFT_BG, SOFT_BORDER } from '../detail-styles';

import { DetailSection } from './DetailSection';

import type { CourseFaq } from '@/schemas/course-extras.schema';
import type { FC } from 'react';

interface CourseFaqSectionProps {
  faqs: readonly CourseFaq[];
}

const ACCORDION_SX = {
  position: 'relative',
  bgcolor: SOFT_BG,
  border: `1px solid ${SOFT_BORDER}`,
  borderRadius: `${CARD_RADIUS} !important`,
  overflow: 'hidden',
  '&::before': { display: 'none' },
  '&.Mui-expanded': { bgcolor: '#f8faff', borderColor: '#bfdbfe' },
  '&.Mui-expanded::after': {
    content: '""',
    position: 'absolute',
    inset: '0 0 auto 0',
    height: 6,
    background: 'linear-gradient(90deg, #2563eb, #0891b2, #4f46e5)',
  },
} as const;
const ANSWER_SX = {
  p: { xs: 2, sm: 3 },
  borderRadius: '14px',
  border: '1px solid #dbeafe',
  background: 'linear-gradient(120deg, #eff6ff 0%, #f5f3ff 55%, #ecfdf5 100%)',
} as const;

/** Frequently asked questions: one card per question (the first open); the answer sits on a soft gradient box. */
export const CourseFaqSection: FC<CourseFaqSectionProps> = ({ faqs }) => {
  const { t } = useTranslation();
  if (faqs.length === 0) return null;
  return (
    <DetailSection id="course-faq" title={t('browse.extras.faqTitle')} plain>
      <Box sx={{ display: 'grid', gap: 2 }}>
        {faqs.map((faq, index) => (
          <Accordion
            key={`${faq.question}-${index}`}
            elevation={0}
            disableGutters
            defaultExpanded={index === 0}
            sx={ACCORDION_SX}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ minHeight: 64, px: { xs: 2, sm: 3 } }}
            >
              {/* The accordion heading slot is already an h3 */}
              <Typography component="span" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {faq.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pt: 0, pb: { xs: 2, sm: 3 } }}>
              <Box sx={ANSWER_SX}>
                <Typography sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                  {faq.answer}
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </DetailSection>
  );
};
