'use client';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useCommunitySettings } from '@/api/community.api';
import { QueryState } from '@/components/common/QueryState';

import { HeaderSettingsForm } from './HeaderSettingsForm';

/** Hero title, description and background picture of the hub. */
export const HeaderSettingsSection = () => {
  const { t } = useTranslation();
  const settings = useCommunitySettings();
  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h3" sx={{ fontWeight: 900 }}>
        {t('community.admin.sections.header')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t('community.admin.headerHint')}
      </Typography>
      <QueryState
        isLoading={settings.isPending}
        error={settings.error}
        onRetry={() => void settings.refetch()}
      >
        {settings.data && <HeaderSettingsForm settings={settings.data} />}
      </QueryState>
    </Stack>
  );
};
