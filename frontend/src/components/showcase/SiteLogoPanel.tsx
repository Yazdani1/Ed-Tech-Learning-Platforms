'use client';

import Grid from '@mui/material/Grid';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useSiteLogo, useUpdateSiteLogo } from '@/api/showcase.api';

import { ShowcasePanel } from './common/ShowcasePanel';
import { LogoPicker } from './LogoPicker';
import { LogoPreview } from './LogoPreview';
import { useImageFiles } from './useImageFiles';

/** The site logo: preview of the current one, pick a new image, save (replaces the old logo). */
export const SiteLogoPanel = () => {
  const { t } = useTranslation();
  const logoQuery = useSiteLogo();
  const updateLogo = useUpdateSiteLogo();
  const picked = useImageFiles(1);
  const file = picked.files[0];

  const save = (): void => {
    if (!file) return;
    const data = new FormData();
    data.append('logo', file);
    updateLogo.mutate(data, {
      onSuccess: () => {
        picked.clear();
        toast.success(t('showcase.logo.saved'));
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <ShowcasePanel title={t('showcase.logo.title')} hint={t('showcase.logo.hint')}>
      <Grid container spacing={2} sx={{ p: 2, alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <LogoPreview
            isLoading={logoQuery.isLoading}
            error={logoQuery.error}
            logo={logoQuery.data ?? null}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <LogoPicker
            logo={logoQuery.data ?? null}
            file={file ?? null}
            error={picked.error}
            saving={updateLogo.isPending}
            onFiles={(files) => {
              picked.pick(files.slice(0, 1));
            }}
            onSave={save}
          />
        </Grid>
      </Grid>
    </ShowcasePanel>
  );
};
