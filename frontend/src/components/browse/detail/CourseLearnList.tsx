'use client';

import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface CourseLearnListProps {
  items: readonly string[];
}

/** "What you'll learn": two columns of ticks on wider screens, one on phones. */
export const CourseLearnList: FC<CourseLearnListProps> = ({ items }) => {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return (
    <Box
      component="section"
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: { xs: 2, sm: 3 },
        mb: 4,
      }}
    >
      <Typography component="h2" variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        {t('browse.detail.whatYouWillLearn')}
      </Typography>
      <Grid container spacing={1} component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {items.map((item, index) => (
          <Grid key={`${index}-${item}`} size={{ xs: 12, sm: 6 }} component="li">
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <CheckIcon
                sx={{ fontSize: 18, color: 'success.main', mt: 0.25, flexShrink: 0 }}
                aria-hidden
              />
              <Typography variant="body2">{item}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
