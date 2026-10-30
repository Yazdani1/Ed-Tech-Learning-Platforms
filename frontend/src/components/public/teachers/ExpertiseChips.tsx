'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface ExpertiseChipsProps {
  expertise: string[];
  /** How many to show before "+N" */
  max: number;
}

/** A teacher's subjects as small blue chips. */
export const ExpertiseChips: FC<ExpertiseChipsProps> = ({ expertise, max }) => {
  const { t } = useTranslation();
  const items = expertise.filter(Boolean);
  if (items.length === 0) return null;
  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'center', mt: 1.5 }}>
      {items.slice(0, max).map((item) => (
        <Chip
          key={item}
          label={item}
          size="small"
          sx={{ fontWeight: 700, bgcolor: 'rgba(37,99,235,0.08)', color: 'primary.main' }}
        />
      ))}
      {items.length > max && (
        <Chip label={t('public.instructors.more', { count: items.length - max })} size="small" />
      )}
    </Box>
  );
};
