'use client';

import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { SafeHtml } from '@/components/common/SafeHtml';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface OverviewTextSectionsProps {
  course: Course;
}

/** "What you'll learn", requirements and the course description. */
export const OverviewTextSections: FC<OverviewTextSectionsProps> = ({ course }) => {
  const { t } = useTranslation();
  return (
    <>
      {course.whatYouWillLearn.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography component="h3" variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            {t('learn.overview.whatYouLearn')}
          </Typography>
          <Box
            component="ul"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1,
              p: 0,
              m: 0,
              listStyle: 'none',
            }}
          >
            {course.whatYouWillLearn.map((item) => (
              <Box component="li" key={item} sx={{ display: 'flex', gap: 1.25 }}>
                <CheckCircleOutlinedIcon
                  sx={{ color: 'success.main', fontSize: 18, mt: 0.2 }}
                  aria-hidden
                />
                <Typography variant="body2">{item}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      {course.requirements.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography component="h3" variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            {t('learn.overview.requirements')}
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            {course.requirements.map((item) => (
              <Box component="li" key={item} sx={{ mb: 0.75 }}>
                <Typography variant="body2">{item}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      {course.description && (
        <Box>
          <Typography component="h3" variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            {t('learn.overview.about')}
          </Typography>
          <SafeHtml html={course.description} sx={{ lineHeight: 1.8, color: 'text.secondary' }} />
        </Box>
      )}
    </>
  );
};
