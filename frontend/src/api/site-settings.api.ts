'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  siteSettingsSchema,
  type CompanyContactForm,
  type SitePageKey,
  type SiteSettings,
} from '@/schemas/site-settings.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

const SETTINGS = '/api/site-settings';
/** Page visibility and contact details change rarely: one read per minute is enough */
const SETTINGS_STALE_MS = 60_000;

// ---- Requests ----

export const getSiteSettings = (): Promise<SiteSettings> =>
  http.get(`${SETTINGS}/public`, siteSettingsSchema);

export const updateHiddenPages = (hiddenPages: SitePageKey[]): Promise<SiteSettings> =>
  http.put(`${SETTINGS}/pages`, { hiddenPages }, siteSettingsSchema);

export const updateCompanyContact = (body: CompanyContactForm): Promise<SiteSettings> =>
  http.put(`${SETTINGS}/contact`, body, siteSettingsSchema);

// ---- Hooks ----

/** Hidden public pages and the company contact (navbar, page gates, course page buy bar, admin screens). */
export const useSiteSettings = (): UseQueryResult<SiteSettings, ApiError> =>
  useQuery({
    queryKey: queryKeys.public.siteSettings,
    queryFn: getSiteSettings,
    staleTime: SETTINGS_STALE_MS,
  });

const useSettingsMutation = <Input>(
  mutationFn: (input: Input) => Promise<SiteSettings>,
): UseMutationResult<SiteSettings, ApiError, Input> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.public.siteSettings, settings);
    },
  });
};

export const useUpdateHiddenPages = (): UseMutationResult<SiteSettings, ApiError, SitePageKey[]> =>
  useSettingsMutation(updateHiddenPages);

export const useUpdateCompanyContact = (): UseMutationResult<
  SiteSettings,
  ApiError,
  CompanyContactForm
> => useSettingsMutation(updateCompanyContact);
