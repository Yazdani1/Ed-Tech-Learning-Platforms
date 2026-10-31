'use client';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { EditDeleteMenu } from '@/components/common/EditDeleteMenu';

import { FreePreviewSwitch } from './FreePreviewSwitch';

import type { FC } from 'react';
import type { QuizBank } from '@/schemas/quiz.schema';

interface QuizBankListItemProps {
  bank: QuizBank;
  selected: boolean;
  onManage: (bank: QuizBank) => void;
  onEdit: (bank: QuizBank) => void;
  onDelete: (bank: QuizBank) => void;
  onTogglePreview: (bank: QuizBank) => void;
}

const SELECTED_TINT = 0.1;
const OPEN_SX = {
  flex: 1,
  minWidth: 0,
  minHeight: 44,
  px: 2,
  py: 1,
  justifyContent: 'flex-start',
  textAlign: 'left',
} as const;

/** A bank in the sidebar: opens its questions; free preview switch; edit and delete. */
export const QuizBankListItem: FC<QuizBankListItemProps> = ({ bank, selected, ...handlers }) => {
  const { t } = useTranslation();
  const { onManage, onEdit, onDelete, onTogglePreview } = handlers;
  return (
    <Box
      component="li"
      sx={{
        display: 'flex',
        alignItems: 'center',
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: (theme) =>
          selected
            ? alpha(theme.palette.warning.main, SELECTED_TINT)
            : theme.palette.background.paper,
      }}
    >
      <ButtonBase
        onClick={() => {
          onManage(bank);
        }}
        aria-current={selected ? 'true' : undefined}
        sx={OPEN_SX}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{ fontWeight: 600, fontSize: '0.85rem', wordBreak: 'break-word' }}
            color={selected ? 'warning.dark' : 'text.primary'}
          >
            {bank.title}
          </Typography>
          {bank.description && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {bank.description}
            </Typography>
          )}
        </Box>
      </ButtonBase>
      <FreePreviewSwitch
        checked={bank.isFreePreview}
        label={t('catalog.quiz.freePreviewFor', { name: bank.title })}
        onToggle={() => {
          onTogglePreview(bank);
        }}
      />
      <EditDeleteMenu
        label={t('catalog.quiz.bankActions', { name: bank.title })}
        onEdit={() => {
          onEdit(bank);
        }}
        onDelete={() => {
          onDelete(bank);
        }}
      />
    </Box>
  );
};
