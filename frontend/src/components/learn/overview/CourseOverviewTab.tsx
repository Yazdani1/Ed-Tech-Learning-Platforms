'use client';

import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { OverviewStat } from './OverviewStat';
import { OverviewTextSections } from './OverviewTextSections';
import { useOverviewStats } from './useOverviewStats';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CourseOverviewTabProps {
  course: Course;
}

/** Title, numbers about the course (students, lectures, duration, content counts) and its description. */
export const CourseOverviewTab: FC<CourseOverviewTabProps> = ({ course }) => {
  const { t } = useTranslation();
  const stats = useOverviewStats(course);

  return (
    <Box component="section" aria-label={t('learn.nav.overview')} sx={{ p: { xs: 2, md: 4 } }}>
      <Typography
        component="h2"
        variant="h4"
        sx={{ fontWeight: 800, mb: 0.75, wordBreak: 'break-word' }}
      >
        {course.title}
      </Typography>
      {course.subtitle && (
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, mb: 2 }}>
          {course.subtitle}
        </Typography>
      )}
      {course.category && (
        <Chip
          icon={<CategoryOutlinedIcon />}
          label={course.category.name}
          size="small"
          sx={{ fontWeight: 600, mb: 3 }}
        />
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
          gap: { xs: 2, sm: 3 },
          mb: 4,
          p: { xs: 2, sm: 3 },
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        {stats.map((stat) => (
          <OverviewStat
            key={stat.key}
            icon={stat.icon}
            label={t(`learn.overview.${stat.key}`)}
            value={stat.value}
          />
        ))}
      </Box>
      <Divider sx={{ mb: 4 }} />
      <OverviewTextSections course={course} />
    </Box>
  );
};
