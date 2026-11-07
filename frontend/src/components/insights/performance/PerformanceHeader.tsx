'use client';

import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { PAGE_TITLE_SX } from '@/components/common/PageHeader';

import type { FC } from 'react';

interface PerformanceHeaderProps {
  /** "All courses", the selected course's title, or "3 courses" */
  courseLabel: string;
  onChooseCourse: () => void;
}

/** "Overview <courses ▾>": the course label opens the course picker. */
export const PerformanceHeader: FC<PerformanceHeaderProps> = ({ courseLabel, onChooseCourse }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', minWidth: 0 }}>
        <Typography component="h1" sx={PAGE_TITLE_SX}>
          {t('insights.performance.title')}
        </Typography>
        <Button
          variant="text"
          endIcon={<KeyboardArrowDown />}
          onClick={onChooseCourse}
          aria-label={t('insights.performance.chooseCourse', { course: courseLabel })}
          sx={{
            fontWeight: 700,
            fontSize: PAGE_TITLE_SX.fontSize,
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
    </Box>
  );
};
