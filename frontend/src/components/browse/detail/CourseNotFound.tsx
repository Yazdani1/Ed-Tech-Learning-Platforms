'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

/** A course that does not exist, or is a draft / private course the viewer may not see. */
export const CourseNotFound = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ textAlign: 'center', mt: 12, px: 2 }}>
      <Typography component="h1" variant="h5">
        {t('browse.detail.notFound')}
      </Typography>
      <Button component={Link} href="/" sx={{ mt: 2, minHeight: 44 }}>
        {t('browse.detail.backHome')}
      </Button>
    </Box>
  );
};
