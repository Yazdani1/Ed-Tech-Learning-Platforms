'use client';

import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';
import type { QuizBank } from '@/schemas/quiz.schema';

interface QuizBankPanelHeaderProps {
  bank: QuizBank;
  onEditBank: () => void;
  onAddQuestion: () => void;
}

const ROW_SX = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 2,
  mb: 3,
} as const;

/** The open bank title and description with Edit Bank and Add Question. */
export const QuizBankPanelHeader: FC<QuizBankPanelHeaderProps> = ({
  bank,
  onEditBank,
  onAddQuestion,
}) => {
  const { t } = useTranslation();
  return (
    <Box sx={ROW_SX}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" component="h3" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
          {bank.title}
        </Typography>
        {bank.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {bank.description}
          </Typography>
        )}
      </Box>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<EditOutlinedIcon />}
          onClick={onEditBank}
          sx={{ minHeight: 44 }}
        >
          {t('catalog.quiz.editBank')}
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddQuestion}
          sx={{ minHeight: 44 }}
        >
          {t('catalog.quiz.addQuestion')}
        </Button>
      </Stack>
    </Box>
  );
};
