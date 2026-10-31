'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface LiveClassTabHeaderProps {
  count: number;
  onAdd: () => void;
}

const ROW_SX = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 2,
  mb: 3,
} as const;

/** "Live Class (n)" with its explanation and the Add Week button. */
export const LiveClassTabHeader: FC<LiveClassTabHeaderProps> = ({ count, onAdd }) => {
  const { t } = useTranslation();
  return (
    <Box sx={ROW_SX}>
      <Box>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          {t('catalog.liveClass.title', { count })}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('catalog.liveClass.subtitle')}
        </Typography>
      </Box>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd} sx={{ minHeight: 44 }}>
        {t('catalog.liveClass.addWeek')}
      </Button>
    </Box>
  );
};
