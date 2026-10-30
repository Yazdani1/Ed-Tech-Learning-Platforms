'use client';

import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface QuizBankLinkProps {
  courseId: string;
  bank: { _id: string; title: string };
  isFreePreview: boolean;
  last: boolean;
}

/** A quiz bank row: opens the practice quiz page on this bank. */
export const QuizBankLink: FC<QuizBankLinkProps> = ({ courseId, bank, isFreePreview, last }) => {
  const { t } = useTranslation();
  const href = `/practice-quiz?${new URLSearchParams({ courseId, bankId: bank._id }).toString()}`;
  return (
    <ListItemButton
      component={Link}
      href={href}
      sx={{
        px: { xs: 2, sm: 3 },
        py: 1.5,
        minHeight: 48,
        gap: 1,
        borderBottom: last ? 'none' : '1px solid',
        borderColor: 'divider',
        justifyContent: 'space-between',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
        <QuizOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} aria-hidden />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {bank.title}
        </Typography>
      </Box>
      {isFreePreview && (
        <Chip
          label={t('browse.content.freePreview')}
          size="small"
          variant="outlined"
          sx={{
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 800,
            borderColor: 'success.main',
            color: 'success.main',
          }}
        />
      )}
    </ListItemButton>
  );
};
