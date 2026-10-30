'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { COURSE_TYPE_GRADIENT } from '../card/CourseTypeBadge';

import type { CourseTypeRef } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CourseTypeBlockProps {
  courseType: CourseTypeRef;
}

const NAME_SX = {
  fontWeight: 900,
  display: 'inline-block',
  background: COURSE_TYPE_GRADIENT,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
} as const;

/** "Course Type" label, the type's name in the brand gradient and its description. */
export const CourseTypeBlock: FC<CourseTypeBlockProps> = ({ courseType }) => {
  const { t } = useTranslation();
  return (
    <>
      <Typography
        variant="overline"
        sx={{ color: 'text.secondary', letterSpacing: 2, display: 'block' }}
      >
        {t('browse.detail.courseType')}
      </Typography>
      <Typography component="p" variant="h5" sx={NAME_SX}>
        {courseType.name}
      </Typography>
      {courseType.description && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mt: 1 }}>
            {courseType.description}
          </Typography>
        </Box>
      )}
    </>
  );
};
