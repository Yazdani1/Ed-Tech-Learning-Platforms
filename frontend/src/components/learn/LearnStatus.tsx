'use client';

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface LearnStatusProps {
  kind: 'noAccess' | 'notFound';
  courseId: string;
  backHref: string;
}

/** Full-page messages: "enrol first" (the server answered 403) or "course not found". */
export const LearnStatus: FC<LearnStatusProps> = ({ kind, courseId, backHref }) => {
  const { t } = useTranslation();
  const Icon = kind === 'noAccess' ? LockOutlinedIcon : SearchOffIcon;
  return (
    <Box sx={{ textAlign: 'center', mt: { xs: 8, md: 12 }, px: 2, maxWidth: 520, mx: 'auto' }}>
      <Icon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} aria-hidden />
      <Typography component="h1" variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        {t(`learn.status.${kind}Title`)}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t(`learn.status.${kind}Message`)}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
        {kind === 'noAccess' && (
          <Button
            variant="contained"
            component={Link}
            href={`/courses/${courseId}`}
            sx={{ minHeight: 44 }}
          >
            {t('learn.status.viewCourse')}
          </Button>
        )}
        <Button component={Link} href={backHref} sx={{ minHeight: 44 }}>
          {t('learn.back')}
        </Button>
      </Box>
    </Box>
  );
};
