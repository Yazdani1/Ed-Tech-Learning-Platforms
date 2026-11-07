'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useSiteSettings, useUpdateHiddenPages } from '@/api/site-settings.api';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { PUBLIC_NAV_LINKS, type PublicLink } from '@/components/public/common/public-links';
import { RequireRole } from '@/components/permissions/RequireRole';
import { SUPER_ADMIN_ROLES } from '@/utils/roles';

import { SitePageRow } from './SitePageRow';

/** Super Admin: one switch per public navbar page (off = link hidden and the address answers "not found"). */
export const SitePagesPage = () => {
  const { t } = useTranslation();
  const query = useSiteSettings();
  // One save at a time (every switch waits), so two quick changes never overwrite each other
  const update = useUpdateHiddenPages();
  const hidden = query.data?.hiddenPages ?? [];

  const toggle = (link: PublicLink, active: boolean): void => {
    const next = active
      ? hidden.filter((page) => page !== link.pageKey)
      : [...hidden, link.pageKey];
    const page = t(link.labelKey);
    update.mutate(next, {
      onSuccess: () => {
        toast.success(t(active ? 'showcase.pages.shown' : 'showcase.pages.hidden', { page }));
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <RequireRole roles={SUPER_ADMIN_ROLES}>
      <Box>
        <PageHeader title={t('showcase.pages.title')} />
        <QueryState
          isLoading={query.isPending}
          error={query.error}
          onRetry={() => void query.refetch()}
          isEmpty={false}
        >
          <Card variant="outlined" sx={{ maxWidth: 720 }}>
            <List disablePadding aria-label={t('showcase.pages.listLabel')}>
              {PUBLIC_NAV_LINKS.map((link, index) => (
                <SitePageRow
                  key={link.pageKey}
                  link={link}
                  active={!hidden.includes(link.pageKey)}
                  disabled={update.isPending}
                  divider={index < PUBLIC_NAV_LINKS.length - 1}
                  onToggle={(active) => {
                    toggle(link, active);
                  }}
                />
              ))}
            </List>
          </Card>
        </QueryState>
      </Box>
    </RequireRole>
  );
};
