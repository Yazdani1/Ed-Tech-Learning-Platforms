'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { SafeHtml } from '@/components/common/SafeHtml';

import type { FC } from 'react';

interface CourseTextSectionsProps {
  requirements: readonly string[];
  /** Rich text from the course editor (sanitised by SafeHtml) */
  description: string;
}

/** "Requirements" (bullet list) and "About this course" (rich text); each hidden when empty. */
export const CourseTextSections: FC<CourseTextSectionsProps> = ({ requirements, description }) => {
  const { t } = useTranslation();
  return (
    <>
      {requirements.length > 0 && (
        <Box component="section" sx={{ mb: 4 }}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            {t('browse.detail.requirements')}
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            {requirements.map((item, index) => (
              <Box component="li" key={`${index}-${item}`} sx={{ mb: 0.75 }}>
                <Typography variant="body2">{item}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      {description.trim() !== '' && (
        <Box component="section" sx={{ mb: 4 }}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            {t('browse.detail.about')}
          </Typography>
          <SafeHtml
            html={description}
            sx={{ '& p': { mt: 0, mb: 1.5 }, '& ul': { pl: 3 }, lineHeight: 1.8 }}
          />
        </Box>
      )}
    </>
  );
};
