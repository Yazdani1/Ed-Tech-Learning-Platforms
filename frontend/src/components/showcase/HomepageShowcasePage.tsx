'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/common/PageHeader';
import { RequireRole } from '@/components/permissions/RequireRole';
import { MANAGER_ROLES } from '@/utils/roles';

import { HeroPostsPanel } from './HeroPostsPanel';
import { SiteLogoPanel } from './SiteLogoPanel';

/** /admin/homepage-showcase (Super Admin and Admin): the site logo and the homepage slider images. */
export const HomepageShowcasePage = () => {
  const { t } = useTranslation();
  return (
    <RequireRole roles={MANAGER_ROLES}>
      <Box>
        <PageHeader title={t('showcase.title')} subtitle={t('showcase.subtitle')} />
        <SiteLogoPanel />
        <HeroPostsPanel />
      </Box>
    </RequireRole>
  );
};
