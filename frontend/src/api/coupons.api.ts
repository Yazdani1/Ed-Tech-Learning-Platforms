'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { z } from 'zod';

import {
  courseCouponSchema,
  courseOfferSchema,
  type CourseCoupon,
  type CourseOffer,
  type DiscountType,
} from '@/schemas/coupon.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

const COUPONS = '/api/coupons';

/** POST / PATCH body of a course coupon (dates ISO or '' to clear; usageLimit null = unlimited). */
export interface CouponRequest {
  code: string;
  discountType: DiscountType;
  value: number;
  usageLimit: number | null;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
}

export interface SaveCouponInput {
  courseId: string;
  /** Set when editing */
  id?: string;
  body: Partial<CouponRequest>;
}

const savedCouponSchema = z.object({ _id: z.string(), code: z.string() });

// ---- Requests ----

export const getCourseCoupons = (courseId: string): Promise<CourseCoupon[]> =>
  http.get(COUPONS, z.array(courseCouponSchema), { params: { course: courseId } });

export const suggestCouponCode = (): Promise<string> =>
  http.get(`${COUPONS}/suggest`, z.object({ code: z.string() })).then((data) => data.code);

export const saveCoupon = ({
  courseId,
  id,
  body,
}: SaveCouponInput): Promise<{ _id: string; code: string }> =>
  id
    ? http.patch(`${COUPONS}/${encodeURIComponent(id)}`, body, savedCouponSchema)
    : http.post(COUPONS, { ...body, course: courseId }, savedCouponSchema);

export const deleteCoupon = async (id: string): Promise<void> => {
  await http.send('DELETE', `${COUPONS}/${encodeURIComponent(id)}`);
};

/** What a typed code gives on the course right now (400 with a message when it is not valid). */
export const checkCoupon = (courseId: string, code: string): Promise<CourseOffer> =>
  http.get(`${COUPONS}/check`, courseOfferSchema, { params: { course: courseId, code } });

/** A free 4-digit batch number for the course form. */
export const suggestBatchNumber = (): Promise<string> =>
  http
    .get('/api/courses/batch-number/suggest', z.object({ batchNumber: z.string() }))
    .then((data) => data.batchNumber);

// ---- Hooks ----

/** Every code of a course (Course editor > Coupons). */
export const useCourseCoupons = (courseId: string): UseQueryResult<CourseCoupon[], ApiError> =>
  useQuery({
    queryKey: queryKeys.coupons.course(courseId),
    queryFn: () => getCourseCoupons(courseId),
  });

/** A batch number suggestion, read once for a new course. */
export const useBatchNumberSuggestion = (enabled: boolean): UseQueryResult<string, ApiError> =>
  useQuery({
    queryKey: queryKeys.coupons.batchSuggestion,
    queryFn: suggestBatchNumber,
    enabled,
    staleTime: 0,
    gcTime: 0,
  });

const useCouponMutation = <Input, Output>(
  courseId: string,
  mutationFn: (input: Input) => Promise<Output>,
): UseMutationResult<Output, ApiError, Input> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.course(courseId) }),
  });
};

export const useSaveCoupon = (courseId: string) => useCouponMutation(courseId, saveCoupon);

export const useDeleteCoupon = (courseId: string) => useCouponMutation(courseId, deleteCoupon);

/** A free random code (coupon, promo and course discount forms: the refresh button). */
export const useSuggestCouponCode = (): UseMutationResult<string, ApiError, void> =>
  useMutation({ mutationFn: () => suggestCouponCode() });

/** Another free batch number (course form: the refresh button). */
export const useSuggestBatchNumber = (): UseMutationResult<string, ApiError, void> =>
  useMutation({ mutationFn: () => suggestBatchNumber() });

/** Checks a typed code (course and payment pages); the result is the new price preview. */
export const useCheckCoupon = (
  courseId: string,
): UseMutationResult<CourseOffer, ApiError, string> =>
  useMutation({ mutationFn: (code: string) => checkCoupon(courseId, code) });
