'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface PreviewLearnListProps {
  items: readonly string[];
}

const ITEMS_SHOWN = 3;

/** The first three "what you'll learn" points in the hover preview. */
export const PreviewLearnList: FC<PreviewLearnListProps> = ({ items }) => {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return (
    <Box sx={{ mb: 1.75 }}>
      <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
        {t('browse.card.whatYouWillLearn')}
      </Typography>
      {items.slice(0, ITEMS_SHOWN).map((item) => (
        <Typography key={item} variant="body2" sx={{ mt: 0.5, lineHeight: 1.35 }}>
          - {item}
        </Typography>
      ))}
    </Box>
  );
};
