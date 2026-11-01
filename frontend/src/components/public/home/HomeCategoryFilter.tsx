'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { useCategories } from '@/api/catalog.api';

import { CategoryFilterCard } from './CategoryFilterCard';

import type { FC } from 'react';

interface HomeCategoryFilterProps {
  /** Section title, for the group's accessible name */
  section: string;
  /** Course count per category id (this section's pricing only) */
  counts: Record<string, number>;
  selected: string;
  onSelect: (categoryId: string) => void;
}

/** "All" plus every category that has courses in this section; one row that scrolls sideways on phones. */
export const HomeCategoryFilter: FC<HomeCategoryFilterProps> = ({
  section,
  counts,
  selected,
  onSelect,
}) => {
  const { t } = useTranslation();
  const { data } = useCategories();
  const categories = (data ?? []).filter((category) => (counts[category._id] ?? 0) > 0);
  if (categories.length === 0) return null;
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <Box
      role="group"
      aria-label={t('public.home.categoriesLabel', { section })}
      sx={{
        display: 'flex',
        gap: 1.5,
        flexWrap: { xs: 'nowrap', md: 'wrap' },
        justifyContent: { md: 'center' },
        overflowX: { xs: 'auto', md: 'visible' },
        pb: 1,
        mb: { xs: 2, md: 3 },
      }}
    >
      <CategoryFilterCard
        name={t('public.home.allCategories')}
        count={total}
        selected={selected === ''}
        onSelect={() => {
          onSelect('');
        }}
      />
      {categories.map((category) => (
        <CategoryFilterCard
          key={category._id}
          name={category.name}
          count={counts[category._id] ?? 0}
          selected={selected === category._id}
          onSelect={() => {
            onSelect(category._id);
          }}
        />
      ))}
    </Box>
  );
};
