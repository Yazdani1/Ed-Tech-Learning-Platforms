'use client';

import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import { useTranslation } from 'react-i18next';

import { PageHeader } from './PageHeader';

import type { FC } from 'react';

interface MigratingPageProps {
  /** i18n key of the page title */
  titleKey: string;
  /** A public page with no shell around it: adds the <main> landmark and page padding */
  standalone?: boolean;
}

/**
 * Stage A only: stands in for a page until the migrate-react-page skill moves the real screen from
 * legacy-frontend/ (Phase 8). Delete it once no page uses it.
 */
export const MigratingPage: FC<MigratingPageProps> = ({ titleKey, standalone = false }) => {
  const { t } = useTranslation();
  const content = (
    <>
      <PageHeader title={t(titleKey)} />
      <Alert severity="info">{t('pages.migrating')}</Alert>
    </>
  );
  return standalone ? (
    <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      {content}
    </Container>
  ) : (
    content
  );
};
