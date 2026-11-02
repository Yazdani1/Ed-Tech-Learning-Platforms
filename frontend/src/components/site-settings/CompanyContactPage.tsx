'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { useSiteSettings } from '@/api/site-settings.api';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { RequireRole } from '@/components/permissions/RequireRole';
import { MANAGER_ROLES } from '@/utils/roles';

import { CompanyContactForm } from './CompanyContactForm';

/** Super Admin and Admin: the company's phone, WhatsApp, email and address (the course page "Call Now"). */
export const CompanyContactPage = () => {
  const { t } = useTranslation();
  const query = useSiteSettings();

  return (
    <RequireRole roles={MANAGER_ROLES}>
      <Box>
        <PageHeader title={t('showcase.contact.title')} subtitle={t('showcase.contact.subtitle')} />
        <QueryState
          isLoading={query.isPending}
          error={query.error}
          onRetry={() => void query.refetch()}
          isEmpty={false}
        >
          {query.data && <CompanyContactForm contact={query.data.contact} />}
        </QueryState>
      </Box>
    </RequireRole>
  );
};
