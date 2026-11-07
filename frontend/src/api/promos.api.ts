'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { z } from 'zod';

import {
  activePromoSchema,
  promoCourseCardSchema,
  promoDesignSchema,
  promoSchema,
  type ActivePromo,
  type Promo,
  type PromoDesign,
  type PromoDesignSlot,
} from '@/schemas/promo.schema';
import { auditHistorySchema, type AuditEntry } from '@/schemas/audit.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

import type { DiscountType } from '@/schemas/coupon.schema';
import type { CourseCardData } from '@/schemas/public.schema';
import type { ListResult } from '@/types';

const PROMOS = '/api/promos';

export interface PromoRequest {
  title: string;
  code: string;
  discountType: DiscountType;
  value: number;
  startsAt: string;
  endsAt: string;
  courseIds: string[];
  isActive?: boolean;
}

export interface SavePromoInput {
  id?: string;
  body: Partial<PromoRequest>;
}

const savedPromoSchema = z.object({ _id: z.string() });

// ---- Requests ----

export const getPromos = (page: number, limit: number): Promise<ListResult<Promo>> =>
  http.list(PROMOS, promoSchema, { params: { page, limit } });

export const getActivePromos = (): Promise<ActivePromo[]> =>
  http.get(`${PROMOS}/active`, z.array(activePromoSchema));

export const getActivePromoCourses = (): Promise<CourseCardData[]> =>
  http.get(`${PROMOS}/active/courses`, z.array(promoCourseCardSchema));

export const savePromo = ({ id, body }: SavePromoInput) =>
  id
    ? http.patch(`${PROMOS}/${encodeURIComponent(id)}`, body, savedPromoSchema)
    : http.post(PROMOS, body, savedPromoSchema);

export const deletePromo = async (id: string): Promise<void> => {
  await http.send('DELETE', `${PROMOS}/${encodeURIComponent(id)}`);
};

// ---- Hooks ----

export const usePromos = (
  page: number,
  limit: number,
): UseQueryResult<ListResult<Promo>, ApiError> =>
  useQuery({
    queryKey: queryKeys.promos.list({ page, limit }),
    queryFn: () => getPromos(page, limit),
    placeholderData: keepPreviousData,
  });

/** The running promos (newest first): home banner, pop-up and the promo page. */
export const useActivePromos = (): UseQueryResult<ActivePromo[], ApiError> =>
  useQuery({ queryKey: queryKeys.promos.active, queryFn: getActivePromos });

export const useActivePromoCourses = (): UseQueryResult<CourseCardData[], ApiError> =>
  useQuery({ queryKey: queryKeys.promos.activeCourses, queryFn: getActivePromoCourses });

const usePromoMutation = <Input, Output>(
  mutationFn: (input: Input) => Promise<Output>,
): UseMutationResult<Output, ApiError, Input> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    // Course prices everywhere follow the running promos
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.promos.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.browse.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.public.all }),
      ]),
  });
};

export const useSavePromo = () => usePromoMutation(savePromo);

export const useDeletePromo = () => usePromoMutation(deletePromo);

// ---- Promo design pictures and history ----

/** Five minutes: the pictures change rarely */
const DESIGN_STALE_MS = 300_000;

export const getPromoDesign = (): Promise<PromoDesign> =>
  http.get(`${PROMOS}/design`, promoDesignSchema);

export const uploadPromoDesign = ({
  slot,
  file,
}: {
  slot: PromoDesignSlot;
  file: File;
}): Promise<PromoDesign> => {
  const body = new FormData();
  body.append('image', file);
  return http.put(`${PROMOS}/design/${slot}`, body, promoDesignSchema);
};

export const deletePromoDesign = (slot: PromoDesignSlot): Promise<PromoDesign> =>
  http.delete(`${PROMOS}/design/${slot}`, promoDesignSchema);

export const getPromoHistory = (id: string): Promise<AuditEntry[]> =>
  http.get(`${PROMOS}/${encodeURIComponent(id)}/history`, auditHistorySchema);

/** The custom banner and pop-up pictures (public: home and course pages). */
export const usePromoDesign = (): UseQueryResult<PromoDesign, ApiError> =>
  useQuery({
    queryKey: queryKeys.promos.design,
    queryFn: getPromoDesign,
    staleTime: DESIGN_STALE_MS,
  });

const useDesignMutation = <Input>(
  mutationFn: (input: Input) => Promise<PromoDesign>,
): UseMutationResult<PromoDesign, ApiError, Input> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (design) => {
      queryClient.setQueryData(queryKeys.promos.design, design);
    },
  });
};

export const useUploadPromoDesign = () => useDesignMutation(uploadPromoDesign);

export const useDeletePromoDesign = () => useDesignMutation(deletePromoDesign);

/** Every switch on / off of one promo (loads while its history is open). */
export const usePromoHistory = (id: string | undefined): UseQueryResult<AuditEntry[], ApiError> =>
  useQuery({
    queryKey: queryKeys.promos.history(id ?? ''),
    queryFn: () => getPromoHistory(id ?? ''),
    enabled: Boolean(id),
  });
