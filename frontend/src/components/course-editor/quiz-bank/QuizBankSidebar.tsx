'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { QuizSectionBlock, type QuizSidebarHandlers } from './QuizSectionBlock';

import type { FC } from 'react';
import type { QuizBank, QuizSection } from '@/schemas/quiz.schema';

interface QuizBankSidebarProps {
  sections: QuizSection[];
  banks: QuizBank[];
  managingBankId: string | null;
  onAddSection: () => void;
  handlers: QuizSidebarHandlers;
}

/** Quiz sections with their banks; "+" adds a section. */
export const QuizBankSidebar: FC<QuizBankSidebarProps> = ({
  sections,
  banks,
  managingBankId,
  onAddSection,
  handlers,
}) => {
  const { t } = useTranslation();
  const addLabel = t('catalog.quiz.addSection');
  return (
    <Box component="nav" aria-label={t('catalog.quiz.title')} sx={{ bgcolor: 'background.paper' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 700 }}>
            {t('catalog.quiz.title')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('catalog.quiz.sectionCount', { count: sections.length })}
          </Typography>
        </Box>
        <Tooltip title={addLabel}>
          <IconButton aria-label={addLabel} onClick={onAddSection} sx={{ width: 44, height: 44 }}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      {sections.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 3 }}>
          {t('catalog.quiz.noSections')}
        </Typography>
      ) : (
        <Box component="ul" sx={{ m: 0, p: 0 }}>
          {sections.map((section) => (
            <QuizSectionBlock
              key={section._id}
              section={section}
              banks={banks.filter((bank) => bank.quizSection === section._id)}
              managingBankId={managingBankId}
              handlers={handlers}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};
