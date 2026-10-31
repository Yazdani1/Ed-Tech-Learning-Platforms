'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useSubscriptionPlans } from '@/api/catalog.api';
import { QueryState } from '@/components/common/QueryState';
import { useModal } from '@/hooks/useModal';

import { PlanCard } from './PlanCard';
import { PlanFormModal } from './PlanFormModal';

import type { SubscriptionPlan } from '@/schemas/catalog.schema';

/** Plan configuration: one card per active plan, Add / Edit / Delete. */
export const PlansPanel = () => {
  const { t } = useTranslation();
  const plans = useSubscriptionPlans();
  const modal = useModal<SubscriptionPlan>();
  const list = plans.data ?? [];

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="body1" color="text.secondary" sx={{ flex: '1 1 280px' }}>
          {t('people.plans.intro')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            modal.openModal();
          }}
          sx={{ minHeight: 44 }}
        >
          {t('people.plans.add')}
        </Button>
      </Box>
      <QueryState
        isLoading={plans.isLoading}
        error={plans.error}
        onRetry={() => void plans.refetch()}
        isEmpty={list.length === 0}
        emptyText={t('people.plans.empty')}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 3,
          }}
        >
          {list.map((plan) => (
            <PlanCard key={plan._id} plan={plan} onEdit={modal.openModal} />
          ))}
        </Box>
      </QueryState>
      <PlanFormModal open={modal.open} plan={modal.data} onClose={modal.closeModal} />
    </Box>
  );
};
