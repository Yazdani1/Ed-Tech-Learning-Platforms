'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { QuizBankLink } from './QuizBankLink';

import type { PublicQuizSection } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface QuizSectionListProps {
  courseId: string;
  sections: readonly PublicQuizSection[];
}

/** Free-preview quiz sections of the course; each bank opens the practice quiz page. */
export const QuizSectionList: FC<QuizSectionListProps> = ({ courseId, sections }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      {sections.map((section, index) => (
        <Accordion
          key={section._id}
          elevation={0}
          disableGutters
          defaultExpanded={index === 0}
          sx={{
            borderBottom: index < sections.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
            '&::before': { display: 'none' },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ bgcolor: 'grey.50', minHeight: 48 }}
          >
            <Typography component="span" sx={{ fontWeight: 800, fontSize: '0.95rem', mr: 1.5 }}>
              {section.title}
            </Typography>
            {section.isFreePreview && (
              <Chip
                label={t('browse.content.freePreview')}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  bgcolor: 'success.main',
                  color: 'common.white',
                }}
              />
            )}
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <List disablePadding>
              {section.banks.map((bank, bankIndex) => (
                <QuizBankLink
                  key={bank._id}
                  courseId={courseId}
                  bank={bank}
                  isFreePreview={section.isFreePreview || bank.isFreePreview}
                  last={bankIndex === section.banks.length - 1}
                />
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};
