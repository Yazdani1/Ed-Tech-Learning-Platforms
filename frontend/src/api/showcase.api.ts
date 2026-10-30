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
  heroPostSchema,
  siteLogoSchema,
  type HeroPost,
  type SiteLogo,
} from '@/schemas/showcase.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

const HERO = '/api/home-hero-posts';
/** Uploads can take longer than the default request timeout (several images go to Cloudinary). */
const UPLOAD_TIMEOUT_MS = 120_000;

// ---- Requests ----

/** Admin list: every post, sorted by position (then newest). */
export const getHeroPosts = async (): Promise<HeroPost[]> =>
  (await http.list(HERO, heroPostSchema)).items;

export const getSiteLogo = (): Promise<SiteLogo | null> =>
  http.get(`${HERO}/logo`, siteLogoSchema.nullable());

/** Multipart: `images` (one or more files), visibility, publishAt (UTC ISO or empty), order. */
export const uploadHeroPosts = (data: FormData): Promise<HeroPost[]> =>
  http.post(HERO, data, z.array(heroPostSchema), { timeoutMs: UPLOAD_TIMEOUT_MS });

export interface UpdateHeroPostInput {
  id: string;
  /** Multipart: optional `image` (replacement), visibility, publishAt, order */
  data: FormData;
}

export const updateHeroPost = ({ id, data }: UpdateHeroPostInput): Promise<HeroPost> =>
  http.put(`${HERO}/${id}`, data, heroPostSchema, { timeoutMs: UPLOAD_TIMEOUT_MS });

export const reorderHeroPosts = async (orderedIds: string[]): Promise<void> => {
  await http.send('PATCH', `${HERO}/reorder`, { orderedIds });
};

export const deleteHeroPost = async (id: string): Promise<void> => {
  await http.send('DELETE', `${HERO}/${id}`);
};

/** Multipart `logo`: creates the logo the first time, replaces it afterwards. */
export const updateSiteLogo = (data: FormData): Promise<SiteLogo> =>
  http.put(`${HERO}/logo`, data, siteLogoSchema, { timeoutMs: UPLOAD_TIMEOUT_MS });

// ---- Hooks ----

export const useHeroPosts = (): UseQueryResult<HeroPost[], ApiError> =>
  useQuery({ queryKey: queryKeys.showcase.posts, queryFn: getHeroPosts });

export const useSiteLogo = (): UseQueryResult<SiteLogo | null, ApiError> =>
  useQuery({ queryKey: queryKeys.showcase.logo, queryFn: getSiteLogo });

/** A mutation that refreshes the post list when it succeeds. */
const usePostsMutation = <TData, TInput>(
  mutationFn: (input: TInput) => Promise<TData>,
): UseMutationResult<TData, ApiError, TInput> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.showcase.posts }),
        queryClient.invalidateQueries({ queryKey: queryKeys.public.heroPosts }),
      ]),
  });
};

export const useUploadHeroPosts = (): UseMutationResult<HeroPost[], ApiError, FormData> =>
  usePostsMutation(uploadHeroPosts);

export const useUpdateHeroPost = (): UseMutationResult<HeroPost, ApiError, UpdateHeroPostInput> =>
  usePostsMutation(updateHeroPost);

export const useDeleteHeroPost = (): UseMutationResult<void, ApiError, string> =>
  usePostsMutation(deleteHeroPost);

/** Shows the new order at once (optimistic); the list is reloaded from the server afterwards. */
export const useReorderHeroPosts = (): UseMutationResult<
  void,
  ApiError,
  string[],
  { previous: HeroPost[] | undefined }
> => {
  const queryClient = useQueryClient();
  const key = queryKeys.showcase.posts;
  return useMutation({
    mutationFn: reorderHeroPosts,
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<HeroPost[]>(key);
      if (previous) {
        const byId = new Map(previous.map((post) => [post._id, post]));
        const next = orderedIds.flatMap((id, order) => {
          const post = byId.get(id);
          return post ? [{ ...post, order }] : [];
        });
        queryClient.setQueryData(key, next);
      }
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: key }),
        queryClient.invalidateQueries({ queryKey: queryKeys.public.heroPosts }),
      ]),
  });
};

export const useUpdateSiteLogo = (): UseMutationResult<SiteLogo, ApiError, FormData> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSiteLogo,
    onSuccess: (logo) => {
      queryClient.setQueryData(queryKeys.showcase.logo, logo);
      return queryClient.invalidateQueries({ queryKey: queryKeys.public.siteLogo });
    },
  });
};
