'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { z } from 'zod';

import {
  channelOrCardSchema,
  channelSchema,
  groupMessageSchema,
  searchUserSchema,
  type Channel,
  type ChannelFormValues,
  type ChannelOrCard,
  type GroupMessage,
  type SearchUser,
} from '@/schemas/group-chat.schema';
import { http, type ApiError } from '@/services/http.service';

import { useInvalidatingMutation } from './invalidating-mutation';
import { queryKeys } from './query-keys';

const BASE = '/api/group-chat';
const channelUrl = (id: string): string => `${BASE}/channels/${encodeURIComponent(id)}`;
/** Up to 10 files of 10 MB go to Cloudinary: longer than the default request timeout. */
const UPLOAD_TIMEOUT_MS = 120_000;
/** The user search starts after this many letters (as the old page did). */
export const USER_SEARCH_MIN_LENGTH = 2;
const PLATFORM_ADMIN_ROLES = ['Super Admin', 'Admin', 'Moderator'];

// ---- Requests ----

/** My channels (platform staff: every channel). */
export const getChannels = (search: string): Promise<Channel[]> =>
  http.get(`${BASE}/channels`, z.array(channelSchema), {
    params: { search: search || undefined },
  });

/** Up to 30 open channels; non-members get the public card only. */
export const getDiscoverChannels = (search: string): Promise<ChannelOrCard[]> =>
  http.get(`${BASE}/channels/discover`, z.array(channelOrCardSchema), {
    params: { search: search || undefined },
  });

export const getChannelMessages = (channelId: string): Promise<GroupMessage[]> =>
  http.get(`${channelUrl(channelId)}/messages`, z.array(groupMessageSchema));

export const searchGroupUsers = (search: string): Promise<SearchUser[]> =>
  http.get(`${BASE}/users/search`, z.array(searchUserSchema), { params: { search } });

export const createChannel = (values: ChannelFormValues): Promise<Channel> =>
  http.post(`${BASE}/channels`, values, channelSchema);

export interface UpdateChannelInput {
  channelId: string;
  values: ChannelFormValues;
}

export const updateChannel = ({ channelId, values }: UpdateChannelInput): Promise<Channel> =>
  http.patch(channelUrl(channelId), values, channelSchema);

/** Public channel: joined (full channel). Private: a pending request (public card). */
export const joinChannel = (channelId: string): Promise<ChannelOrCard> =>
  http.post(`${channelUrl(channelId)}/join`, undefined, channelOrCardSchema);

export const cancelJoinRequest = (channelId: string): Promise<ChannelOrCard> =>
  http.delete(`${channelUrl(channelId)}/join`, channelOrCardSchema);

export interface ChannelUserInput {
  channelId: string;
  userId: string;
}

export const approveJoinRequest = ({ channelId, userId }: ChannelUserInput): Promise<Channel> =>
  http.post(
    `${channelUrl(channelId)}/approve/${encodeURIComponent(userId)}`,
    undefined,
    channelSchema,
  );

export interface AddMembersInput {
  channelId: string;
  userIds: string[];
}

export const addMembers = ({ channelId, userIds }: AddMembersInput): Promise<Channel> =>
  http.post(`${channelUrl(channelId)}/members`, { userIds }, channelSchema);

export const removeMember = ({ channelId, userId }: ChannelUserInput): Promise<Channel> =>
  http.delete(`${channelUrl(channelId)}/members/${encodeURIComponent(userId)}`, channelSchema);

export const leaveChannel = async (channelId: string): Promise<void> => {
  await http.send('POST', `${channelUrl(channelId)}/leave`);
};

export const archiveChannel = async (channelId: string): Promise<void> => {
  await http.send('PATCH', `${channelUrl(channelId)}/archive`);
};

/** Super Admin / Admin / Moderator only. */
export const toggleBlockChannel = (channelId: string): Promise<Channel> =>
  http.patch(`${channelUrl(channelId)}/block`, undefined, channelSchema);

export interface SendMessageInput {
  channelId: string;
  /** Multipart: `content` and up to 10 `files` */
  data: FormData;
}

export const sendGroupMessage = ({ channelId, data }: SendMessageInput): Promise<GroupMessage> =>
  http.post(`${channelUrl(channelId)}/messages`, data, groupMessageSchema, {
    timeoutMs: UPLOAD_TIMEOUT_MS,
  });

export const markChannelRead = async (channelId: string): Promise<void> => {
  await http.send('PATCH', `${channelUrl(channelId)}/read`);
};

// ---- Cache updates (mutations and live socket events) ----

const isMemberOf = (channel: Channel, userId: string): boolean =>
  channel.members.some((member) => member.user._id === userId);

const newestFirst = (a: Channel, b: Channel): number =>
  (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? '');

/** What a viewer sees of a channel in Discover: the full channel for members, else the public card. */
const toDiscoverItem = (channel: Channel, userId: string): ChannelOrCard =>
  isMemberOf(channel, userId)
    ? channel
    : {
        kind: 'card',
        _id: channel._id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        memberCount: channel.members.length,
        hasPendingRequest: channel.joinRequests.some(
          (request) => request.user._id === userId && request.status === 'Pending',
        ),
        lastMessageAt: channel.lastMessageAt,
      };

export interface Viewer {
  userId: string;
  role: string;
}

/** A groupChat:channelUpdated payload: updates (or adds/removes) the channel in every cached list. */
export const applyChannelUpdate = (
  queryClient: QueryClient,
  channel: Channel,
  viewer: Viewer,
): void => {
  const staff = PLATFORM_ADMIN_ROLES.includes(viewer.role);
  const visible =
    staff || (!channel.isArchived && !channel.isBlocked && isMemberOf(channel, viewer.userId));
  queryClient
    .getQueriesData<Channel[]>({ queryKey: queryKeys.groupChat.channelLists })
    .forEach(([key, list]) => {
      if (!list) return;
      const rest = list.filter((item) => item._id !== channel._id);
      const known = rest.length !== list.length;
      // Only the unfiltered list gains channels it did not show yet
      const add = visible && (known || key[2] === '');
      queryClient.setQueryData(key, add ? [...rest, channel].sort(newestFirst) : rest);
    });
  queryClient
    .getQueriesData<ChannelOrCard[]>({ queryKey: queryKeys.groupChat.discoverLists })
    .forEach(([key, list]) => {
      if (!list?.some((item) => item._id === channel._id)) return;
      const open = !channel.isArchived && !channel.isBlocked;
      queryClient.setQueryData(
        key,
        open
          ? list.map((item) =>
              item._id === channel._id ? toDiscoverItem(channel, viewer.userId) : item,
            )
          : list.filter((item) => item._id !== channel._id),
      );
    });
};

/** A new message (socket or own send): appended once to the channel's cached messages. */
export const appendGroupMessage = (queryClient: QueryClient, message: GroupMessage): void => {
  queryClient.setQueryData<GroupMessage[]>(queryKeys.groupChat.messages(message.channel), (old) =>
    old && !old.some((item) => item._id === message._id) ? [...old, message] : old,
  );
};

const clearMyUnread = (queryClient: QueryClient, channelId: string, userId: string): void => {
  queryClient.setQueriesData<Channel[]>({ queryKey: queryKeys.groupChat.channelLists }, (list) =>
    list?.map((channel) =>
      channel._id === channelId
        ? {
            ...channel,
            members: channel.members.map((member) =>
              member.user._id === userId ? { ...member, unreadCount: 0 } : member,
            ),
          }
        : channel,
    ),
  );
};

// ---- Hooks ----

export const useGroupChannels = (search: string): UseQueryResult<Channel[], ApiError> =>
  useQuery({ queryKey: queryKeys.groupChat.channels(search), queryFn: () => getChannels(search) });

export const useDiscoverChannels = (search: string): UseQueryResult<ChannelOrCard[], ApiError> =>
  useQuery({
    queryKey: queryKeys.groupChat.discover(search),
    queryFn: () => getDiscoverChannels(search),
  });

/** Messages of a channel the viewer may open (members and platform staff). */
export const useChannelMessages = (
  channelId: string | null,
  enabled: boolean,
): UseQueryResult<GroupMessage[], ApiError> =>
  useQuery({
    queryKey: queryKeys.groupChat.messages(channelId ?? ''),
    queryFn: () => getChannelMessages(channelId ?? ''),
    enabled: enabled && channelId !== null,
  });

export const useGroupUserSearch = (search: string): UseQueryResult<SearchUser[], ApiError> => {
  const term = search.trim();
  return useQuery({
    queryKey: queryKeys.groupChat.userSearch(term),
    queryFn: () => searchGroupUsers(term),
    enabled: term.length >= USER_SEARCH_MIN_LENGTH,
  });
};

/** What every channel change affects: the channel lists (mine and Discover). */
const CHANNEL_LIST_KEYS = [
  queryKeys.groupChat.channelLists,
  queryKeys.groupChat.discoverLists,
] as const;
const SETTLED = { refreshOn: 'settled' } as const;

type ChannelMutation<TData, TInput> = UseMutationResult<TData, ApiError, TInput>;

export const useCreateChannel = (): ChannelMutation<Channel, ChannelFormValues> =>
  useInvalidatingMutation(createChannel, CHANNEL_LIST_KEYS, SETTLED);
export const useUpdateChannel = (): ChannelMutation<Channel, UpdateChannelInput> =>
  useInvalidatingMutation(updateChannel, CHANNEL_LIST_KEYS, SETTLED);
export const useJoinChannel = (): ChannelMutation<ChannelOrCard, string> =>
  useInvalidatingMutation(joinChannel, CHANNEL_LIST_KEYS, SETTLED);
export const useCancelJoinRequest = (): ChannelMutation<ChannelOrCard, string> =>
  useInvalidatingMutation(cancelJoinRequest, CHANNEL_LIST_KEYS, SETTLED);
export const useApproveJoinRequest = (): ChannelMutation<Channel, ChannelUserInput> =>
  useInvalidatingMutation(approveJoinRequest, CHANNEL_LIST_KEYS, SETTLED);
export const useAddMembers = (): ChannelMutation<Channel, AddMembersInput> =>
  useInvalidatingMutation(addMembers, CHANNEL_LIST_KEYS, SETTLED);
export const useRemoveMember = (): ChannelMutation<Channel, ChannelUserInput> =>
  useInvalidatingMutation(removeMember, CHANNEL_LIST_KEYS, SETTLED);
export const useLeaveChannel = (): ChannelMutation<void, string> =>
  useInvalidatingMutation(leaveChannel, CHANNEL_LIST_KEYS, SETTLED);
export const useArchiveChannel = (): ChannelMutation<void, string> =>
  useInvalidatingMutation(archiveChannel, CHANNEL_LIST_KEYS, SETTLED);
export const useToggleBlockChannel = (): ChannelMutation<Channel, string> =>
  useInvalidatingMutation(toggleBlockChannel, CHANNEL_LIST_KEYS, SETTLED);

export const useSendGroupMessage = (): UseMutationResult<
  GroupMessage,
  ApiError,
  SendMessageInput
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendGroupMessage,
    onSuccess: (message) => {
      appendGroupMessage(queryClient, message);
    },
  });
};

export interface MarkReadInput {
  channelId: string;
  userId: string;
}

/** Sets my unread count of the channel to 0 (on the server and in the cached lists). */
export const useMarkChannelRead = (): UseMutationResult<void, ApiError, MarkReadInput> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId }: MarkReadInput) => markChannelRead(channelId),
    onSuccess: (_data, { channelId, userId }) => {
      clearMyUnread(queryClient, channelId, userId);
    },
  });
};
