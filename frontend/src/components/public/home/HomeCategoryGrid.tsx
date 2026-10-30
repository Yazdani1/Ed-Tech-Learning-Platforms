'use client';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { useCategories } from '@/api/catalog.api';
import { QueryState } from '@/components/common/QueryState';

import { CategoryCard } from './CategoryCard';
import { SectionHeading } from './SectionHeading';

/** "Explore by Category": one tile per category, each opening the catalog filtered by it. */
export const HomeCategoryGrid = () => {
  const { t } = useTranslation();
  const { data, isPending, error, refetch } = useCategories();
  const categories = data ?? [];

  // Nothing to explore yet: the section is left out, as before
  if (!isPending && !error && categories.length === 0) return null;

  return (
    <Box component="section" sx={{ bgcolor: 'background.paper' }}>
      <Container maxWidth="xl" sx={{ pt: { xs: 5, md: 7 }, pb: 6 }}>
        <SectionHeading
          title={t('public.categories.title')}
          subtitle={t('public.categories.subtitle')}
          action={
            <Button
              component={Link}
              href="/courses"
              endIcon={<ArrowForwardIcon />}
              sx={{ fontWeight: 700, minHeight: 44 }}
            >
              {t('public.categories.viewAll')}
            </Button>
          }
        />
        <QueryState
          isLoading={isPending}
          error={error}
          onRetry={() => void refetch()}
          skeletonRows={2}
        >
          <Grid container spacing={2.5}>
            {categories.map((category, index) => (
              <Grid key={category._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <CategoryCard category={category} index={index} />
              </Grid>
            ))}
          </Grid>
        </QueryState>
      </Container>
    </Box>
  );
};
