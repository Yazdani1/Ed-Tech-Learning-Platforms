'use client';

import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { usePointRules } from '@/api/community.api';
import { QueryState } from '@/components/common/QueryState';

import { PointRulesForm } from './PointRulesForm';

/** "Points Settings": how many points each community action earns. */
export const PointRulesSection = () => {
  const { t } = useTranslation();
  const rules = usePointRules();
  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h3" sx={{ fontWeight: 900 }}>
        {t('community.admin.sections.points')}
      </Typography>
      <Divider />
      <QueryState
        isLoading={rules.isPending}
        error={rules.error}
        onRetry={() => void rules.refetch()}
      >
        {rules.data && <PointRulesForm rules={rules.data} />}
      </QueryState>
    </Stack>
  );
};
