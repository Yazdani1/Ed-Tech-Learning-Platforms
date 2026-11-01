'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const SIGN_IN_HREF = `/auth/login?next=${encodeURIComponent('/practice-quiz')}`;

/** Guests: answers are only checked, not saved, until they sign in. */
export const PracticeSignInHint = () => {
  const { t } = useTranslation();
  return (
    <Alert
      severity="info"
      action={
        <Button component={Link} href={SIGN_IN_HREF} color="inherit" sx={{ minHeight: 44 }}>
          {t('quiz.practice.panel.signIn')}
        </Button>
      }
    >
      {t('quiz.practice.panel.signInHint')}
    </Alert>
  );
};
