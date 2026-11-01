'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
  type UseInfiniteQueryResult,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { z } from 'zod';

import {
  badgeSchema,
  channelSchema,
  communityProfileSchema,
  overviewSchema,
  pointRuleSchema,
  postDetailSchema,
  postSchema,
  repliesPageSchema,
  replySchema,
  settingsSchema,
  type CommunityBadge,
  type CommunityChannel,
  type CommunityOverview,
  type CommunityProfile,
  type CommunitySettings,
  type PointRule,
  type Post,
  type PostDetail,
  type ReactionType,
  type Reply,
} from '@/schemas/community.schema';
import { http, type ApiError } from '@/services/http.service';

import { useInvalidatingMutation } from './invalidating-mutation';
import { queryKeys } from './query-keys';

const enc = encodeURIComponent;
const BASE = '/api/community';
/** Discussions per page of the hub (the backend caps guests at 10 without paging). */
export const HUB_PAGE_SIZE = 10;
/** Answers per page on a discussion (same as the backend's default). */
export const REPLIES_PAGE_SIZE = 10;
/** Discussions the detail page reads from the same channel for its sidebar. */
const RELATED_LIMIT = 12;
/** Several images go to Cloudinary: longer than the default request timeout. */
const UPLOAD_TIMEOUT_MS = 120_000;
const upload = { timeoutMs: UPLOAD_TIMEOUT_MS };

/** Hub filters as the backend reads them (empty values are left out). */
export interface HubFilters {
  channel: string;
  dateFrom: string;
  dateTo: string;
  search: string;
  archived: boolean;
}

/** One page of a discussion: the first page also carries the post itself, badges and channels. */
export interface PostPage {
  detail: PostDetail | null;
  replies: Reply[];
  total: number;
  hasMore: boolean;
}

export interface IdData {
  id: string;
  data: FormData;
}

export interface ReactInput {
  id: string;
  type: ReactionType;
}

// ---- Requests ----

const filterParams = (filters: HubFilters): Record<string, string> => {
  const params: Record<string, string> = {};
  if (filters.channel) params.channel = filters.channel;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.archived) params.archived = 'true';
  return params;
};

export const getOverview = (
  params: Record<string, string | number>,
  signal?: AbortSignal,
): Promise<CommunityOverview> => http.get(BASE, overviewSchema, { params, signal });

export const getPostPage = async (postId: string, skip: number): Promise<PostPage> => {
  if (skip === 0) {
    const detail = await http.get(`${BASE}/posts/${enc(postId)}`, postDetailSchema, {
      params: { repliesLimit: REPLIES_PAGE_SIZE },
    });
    const { total, hasMore } = detail.repliesPagination;
    return { detail, replies: detail.post.replies, total, hasMore };
  }
  const page = await http.get(`${BASE}/posts/${enc(postId)}/replies`, repliesPageSchema, {
    params: { skip, limit: REPLIES_PAGE_SIZE },
  });
  return { detail: null, ...page };
};

export const getCommunityProfile = (userId: string): Promise<CommunityProfile> =>
  http.get(`${BASE}/users/${enc(userId)}`, communityProfileSchema);

export const createPost = (data: FormData): Promise<Post> =>
  http.post(`${BASE}/posts`, data, postSchema, upload);

export const updatePost = async ({ id, data }: IdData): Promise<void> => {
  await http.send('PUT', `${BASE}/posts/${enc(id)}`, data, upload);
};

export const reactToPost = ({ id, type }: ReactInput): Promise<Post> =>
  http.patch(`${BASE}/posts/${enc(id)}/reactions`, { type }, postSchema);

export const reactToReply = ({ id, type }: ReactInput): Promise<Reply> =>
  http.patch(`${BASE}/replies/${enc(id)}/reactions`, { type }, replySchema);

export const createReply = async ({ id, data }: IdData): Promise<void> => {
  await http.send('POST', `${BASE}/posts/${enc(id)}/replies`, data, upload);
};

export const createChildReply = async ({ id, body }: { id: string; body: string }) => {
  await http.send('POST', `${BASE}/replies/${enc(id)}/replies`, { body });
};

/** PATCH without a body: pin/unpin a post, accept/unaccept an answer, archive posts and replies. */
const patchAction = async (path: string): Promise<void> => {
  await http.send('PATCH', `${BASE}/${path}`);
};

export const getSettings = (): Promise<CommunitySettings> =>
  http.get(`${BASE}/settings`, settingsSchema);
export const getAdminChannels = (): Promise<CommunityChannel[]> =>
  http.get(`${BASE}/admin/channels`, z.array(channelSchema));
export const getBadges = (): Promise<CommunityBadge[]> =>
  http.get(`${BASE}/badges`, z.array(badgeSchema));
export const getPointRules = (): Promise<PointRule[]> =>
  http.get(`${BASE}/point-rules`, z.array(pointRuleSchema));

// ---- Cache helpers ----

type OverviewData = InfiniteData<CommunityOverview, number>;
/** The hub list query (pages of the overview). */
export type OverviewQuery = UseInfiniteQueryResult<OverviewData, ApiError>;
type PostData = InfiniteData<PostPage, number>;

/** Writes a post returned by the server into every hub list and its detail page (replies stay). */
const patchPost = (queryClient: QueryClient, updated: Post): void => {
  const merge = (post: Post): Post =>
    post._id === updated._id ? { ...post, ...updated, replies: post.replies } : post;
  queryClient.setQueriesData<OverviewData>({ queryKey: queryKeys.community.overviews }, (data) =>
    data
      ? { ...data, pages: data.pages.map((page) => ({ ...page, posts: page.posts.map(merge) })) }
      : data,
  );
  queryClient.setQueryData<PostData>(queryKeys.community.post(updated._id), (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page) =>
            page.detail
              ? { ...page, detail: { ...page.detail, post: merge(page.detail.post) } }
              : page,
          ),
        }
      : data,
  );
};

/** Writes a reply returned by the server into its discussion (its child replies stay). */
const patchReply = (queryClient: QueryClient, postId: string, updated: Reply): void => {
  queryClient.setQueryData<PostData>(queryKeys.community.post(postId), (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            replies: page.replies.map((reply) =>
              reply._id === updated._id
                ? {
                    ...updated,
                    childReplies: reply.childReplies,
                    childReplyCount: reply.childReplyCount,
                  }
                : reply,
            ),
          })),
        }
      : data,
  );
};

// ---- Queries ----

export const useCommunityOverview = (filters: HubFilters): OverviewQuery => {
  const params = filterParams(filters);
  return useInfiniteQuery({
    queryKey: queryKeys.community.overview(params),
    queryFn: ({ pageParam, signal }) =>
      getOverview({ ...params, limit: HUB_PAGE_SIZE, skip: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: ({ postPagination }) =>
      postPagination.hasMore ? postPagination.skip + postPagination.loaded : undefined,
  });
};

/** Other discussions of a channel (detail page sidebar). */
export const useRelatedPosts = (channelId: string | undefined): UseQueryResult<Post[], ApiError> =>
  useQuery({
    queryKey: queryKeys.community.related(channelId ?? ''),
    queryFn: async ({ signal }) =>
      (await getOverview({ channel: channelId ?? '', limit: RELATED_LIMIT }, signal)).posts,
    enabled: Boolean(channelId),
  });

export const useCommunityPost = (postId: string): UseInfiniteQueryResult<PostData, ApiError> =>
  useInfiniteQuery({
    queryKey: queryKeys.community.post(postId),
    queryFn: ({ pageParam }) => getPostPage(postId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, pages) =>
      last.hasMore ? pages.reduce((count, page) => count + page.replies.length, 0) : undefined,
  });

export const useCommunityProfile = (
  userId: string | undefined,
): UseQueryResult<CommunityProfile, ApiError> =>
  useQuery({
    queryKey: queryKeys.community.profile(userId ?? ''),
    queryFn: () => getCommunityProfile(userId ?? ''),
    enabled: Boolean(userId),
  });

export const useCommunitySettings = (): UseQueryResult<CommunitySettings, ApiError> =>
  useQuery({ queryKey: queryKeys.community.settings, queryFn: getSettings });
export const useAdminChannels = (): UseQueryResult<CommunityChannel[], ApiError> =>
  useQuery({ queryKey: queryKeys.community.adminChannels, queryFn: getAdminChannels });
export const useCommunityBadges = (): UseQueryResult<CommunityBadge[], ApiError> =>
  useQuery({ queryKey: queryKeys.community.badges, queryFn: getBadges });
export const usePointRules = (): UseQueryResult<PointRule[], ApiError> =>
  useQuery({ queryKey: queryKeys.community.pointRules, queryFn: getPointRules });

// ---- Mutations ----

/** Every community read (hub, discussions, profiles, admin lists) is fetched again after a change. */
const COMMUNITY_KEYS = [queryKeys.community.all] as const;
const useCommunityMutation = <TData, TInput>(
  mutationFn: (input: TInput) => Promise<TData>,
): UseMutationResult<TData, ApiError, TInput> =>
  useInvalidatingMutation(mutationFn, COMMUNITY_KEYS);

export const useCreatePost = (): UseMutationResult<Post, ApiError, FormData> =>
  useCommunityMutation(createPost);
export const useUpdatePost = (): UseMutationResult<void, ApiError, IdData> =>
  useCommunityMutation(updatePost);
export const useTogglePin = (): UseMutationResult<void, ApiError, string> =>
  useCommunityMutation((id: string) => patchAction(`posts/${enc(id)}/pin`));
export const useArchivePost = (): UseMutationResult<void, ApiError, string> =>
  useCommunityMutation((id: string) => patchAction(`posts/${enc(id)}/archive`));
export const useCreateReply = (): UseMutationResult<void, ApiError, IdData> =>
  useCommunityMutation(createReply);
export const useToggleAccepted = (): UseMutationResult<void, ApiError, string> =>
  useCommunityMutation((id: string) => patchAction(`replies/${enc(id)}/accepted`));
export const useArchiveReply = (): UseMutationResult<void, ApiError, string> =>
  useCommunityMutation((id: string) => patchAction(`replies/${enc(id)}/archive`));
export const useCreateChildReply = (): UseMutationResult<
  void,
  ApiError,
  { id: string; body: string }
> => useCommunityMutation(createChildReply);
export const useArchiveChildReply = (): UseMutationResult<void, ApiError, string> =>
  useCommunityMutation((id: string) => patchAction(`answer-replies/${enc(id)}/archive`));

/** The new reaction list is written into the cache at once (no refetch of the whole hub). */
export const useReactToPost = (): UseMutationResult<Post, ApiError, ReactInput> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reactToPost,
    onSuccess: (post) => {
      patchPost(queryClient, post);
    },
  });
};

export const useReactToReply = (postId: string): UseMutationResult<Reply, ApiError, ReactInput> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reactToReply,
    onSuccess: (reply) => {
      patchReply(queryClient, postId, reply);
    },
  });
};

// Admin tools (Super Admin, Admin)

export const useUpdateSettings = (): UseMutationResult<void, ApiError, FormData> =>
  useCommunityMutation(async (data: FormData) => {
    await http.send('PUT', `${BASE}/settings`, data, upload);
  });

/** Create (no id) or edit a channel. Multipart: name, description, optional image. */
export const useSaveChannel = (): UseMutationResult<void, ApiError, IdData> =>
  useCommunityMutation(async ({ id, data }: IdData) => {
    await (id
      ? http.send('PUT', `${BASE}/channels/${enc(id)}`, data, upload)
      : http.send('POST', `${BASE}/channels`, data, upload));
  });

export const useArchiveChannel = (): UseMutationResult<void, ApiError, string> =>
  useCommunityMutation((id: string) => patchAction(`channels/${enc(id)}/archive`));

/** Create (no id) or edit a badge. Multipart: name, requiredPoints, optional image. */
export const useSaveBadge = (): UseMutationResult<void, ApiError, IdData> =>
  useCommunityMutation(async ({ id, data }: IdData) => {
    await (id
      ? http.send('PUT', `${BASE}/badges/${enc(id)}`, data, upload)
      : http.send('POST', `${BASE}/badges`, data, upload));
  });

export const useArchiveBadge = (): UseMutationResult<void, ApiError, string> =>
  useCommunityMutation((id: string) => patchAction(`badges/${enc(id)}/archive`));

export const useUpdatePointRules = (): UseMutationResult<
  void,
  ApiError,
  { key: PointRule['key']; points: number }[]
> =>
  useCommunityMutation(async (rules: { key: PointRule['key']; points: number }[]) => {
    await http.send('PUT', `${BASE}/point-rules`, { rules });
  });
