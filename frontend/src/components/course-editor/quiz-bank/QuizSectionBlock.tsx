'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { EditDeleteMenu } from '@/components/common/EditDeleteMenu';

import { FreePreviewSwitch } from './FreePreviewSwitch';
import { QuizBankListItem } from './QuizBankListItem';

import type { FC } from 'react';
import type { QuizBank, QuizSection } from '@/schemas/quiz.schema';

export interface QuizSidebarHandlers {
  onManage: (bank: QuizBank) => void;
  onRenameSection: (section: QuizSection) => void;
  onDeleteSection: (section: QuizSection) => void;
  onToggleSectionPreview: (section: QuizSection) => void;
  onAddBank: (section: QuizSection) => void;
  onEditBank: (bank: QuizBank) => void;
  onDeleteBank: (bank: QuizBank) => void;
  onToggleBankPreview: (bank: QuizBank) => void;
}

interface QuizSectionBlockProps {
  section: QuizSection;
  banks: QuizBank[];
  managingBankId: string | null;
  handlers: QuizSidebarHandlers;
}

const TITLE_SX = {
  flex: 1,
  fontWeight: 600,
  fontSize: '0.85rem',
  wordBreak: 'break-word',
  py: 1,
} as const;

/** A quiz section in the sidebar: title, free preview, rename/delete, its banks and "Add Quiz Bank". */
export const QuizSectionBlock: FC<QuizSectionBlockProps> = ({
  section,
  banks,
  managingBankId,
  handlers,
}) => {
  const { t } = useTranslation();
  return (
    <Box
      component="li"
      aria-label={section.title}
      sx={{ borderBottom: 1, borderColor: 'divider', listStyle: 'none' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 2, bgcolor: 'grey.50' }}>
        <Typography component="h4" sx={TITLE_SX}>
          {section.title}
        </Typography>
        <FreePreviewSwitch
          checked={section.isFreePreview}
          label={t('catalog.quiz.freePreviewFor', { name: section.title })}
          onToggle={() => {
            handlers.onToggleSectionPreview(section);
          }}
        />
        <EditDeleteMenu
          label={t('catalog.quiz.sectionActions', { name: section.title })}
          editLabel={t('catalog.quiz.rename')}
          onEdit={() => {
            handlers.onRenameSection(section);
          }}
          onDelete={() => {
            handlers.onDeleteSection(section);
          }}
        />
      </Box>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {banks.map((bank) => (
          <QuizBankListItem
            key={bank._id}
            bank={bank}
            selected={bank._id === managingBankId}
            onManage={handlers.onManage}
            onEdit={handlers.onEditBank}
            onDelete={handlers.onDeleteBank}
            onTogglePreview={handlers.onToggleBankPreview}
          />
        ))}
      </Box>
      <Button
        startIcon={<AddIcon />}
        onClick={() => {
          handlers.onAddBank(section);
        }}
        sx={{ minHeight: 44, mx: 1, my: 0.5 }}
      >
        {t('catalog.quiz.addBank')}
      </Button>
    </Box>
  );
};
