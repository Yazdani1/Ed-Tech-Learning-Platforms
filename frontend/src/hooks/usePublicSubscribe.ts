'use client';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useSubscribe } from '@/api/catalog.api';

export interface PublicSubscribe {
  /** Subscribes the signed-in Student and shows a success or error toast */
  subscribeTo: (plan: string, billingDuration: number) => void;
  /** The plan whose subscribe request is running, if any */
  pendingPlan: string | undefined;
}

/** The /pricing subscribe action (activates the plan at once: there is no payment gateway yet). */
export const usePublicSubscribe = (): PublicSubscribe => {
  const { t } = useTranslation();
  const subscribe = useSubscribe();
  return {
    subscribeTo: (plan, billingDuration) => {
      subscribe.mutate(
        { plan, billingDuration },
        {
          onSuccess: () => toast.success(t('public.pricing.subscribed', { plan })),
          onError: (error) => toast.error(error.message),
        },
      );
    },
    pendingPlan: subscribe.isPending ? subscribe.variables.plan : undefined,
  };
};
