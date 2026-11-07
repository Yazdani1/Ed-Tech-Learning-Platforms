'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { purchasesSchema, type Purchases } from '@/schemas/purchase.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

// Purchases page (Student): every course the student enrolled in with what they paid.

export const getMyPurchases = (): Promise<Purchases> =>
  http.get('/api/enrollments/me/purchases', purchasesSchema);

export const useMyPurchases = (): UseQueryResult<Purchases, ApiError> =>
  useQuery({ queryKey: queryKeys.catalog.myPurchases, queryFn: getMyPurchases });
