'use client';

import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface PerformanceHeaderProps {
  /** Title of the selected course, or "All courses" */
  courseLabel: string;
  onChooseCourse: () => void;
}

/** "Overview <course ▾>": the course name opens the course picker. */
export const PerformanceHeader: FC<PerformanceHeaderProps> = ({ courseLabel, onChooseCourse }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', minWidth: 0 }}>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
          {t('insights.performance.title')}
        </Typography>
        <Button
          variant="text"
          endIcon={<KeyboardArrowDown />}
          onClick={onChooseCourse}
          aria-label={t('insights.performance.chooseCourse', { course: courseLabel })}
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.125rem', sm: '1.5rem' },
            textTransform: 'none',
            color: 'text.primary',
            textAlign: 'left',
            minHeight: 44,
            maxWidth: '100%',
            overflowWrap: 'anywhere',
          }}
        >
          {courseLabel}
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary">
        {t('insights.performance.subtitle')}
      </Typography>
    </Box>
  );
};
