'use client';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useDeletePlan } from '@/api/people.api';
import { toastError } from '@/utils/toast-error';
import { useDeleteConfirm } from '@/hooks/useConfirm';

import type { SubscriptionPlan } from '@/schemas/catalog.schema';
import type { FC } from 'react';

interface PlanCardActionsProps {
  plan: SubscriptionPlan;
  onEdit: (plan: SubscriptionPlan) => void;
}

/** Edit and Delete (after confirmation) under a plan card. */
export const PlanCardActions: FC<PlanCardActionsProps> = ({ plan, onEdit }) => {
  const { t } = useTranslation();
  const confirmDelete = useDeleteConfirm();
  const deletePlan = useDeletePlan();

  const handleDelete = async (): Promise<void> => {
    if (!(await confirmDelete(plan.plan))) return;
    void deletePlan
      .mutateAsync(plan._id)
      .then(() => toast.success(t('people.plans.deleted')))
      .catch(toastError);
  };

  return (
    <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
      <Button
        startIcon={<EditIcon />}
        onClick={() => {
          onEdit(plan);
        }}
        sx={{ minHeight: 44 }}
      >
        {t('common.edit')}
      </Button>
      <IconButton
        color="error"
        aria-label={t('people.plans.deleteLabel', { name: plan.plan })}
        onClick={() => void handleDelete()}
        sx={{ width: 44, height: 44 }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </CardActions>
  );
};
