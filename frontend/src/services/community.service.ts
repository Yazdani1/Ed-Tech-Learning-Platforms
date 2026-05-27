import api from './api';
import type {
  CommunityReactionType,
  ICommunityBadge,
  ICommunityChannel,
  ICommunityOverview,
  ICommunityPostDetail,
  ICommunityPointRule,
  ICommunityPost,
  ICommunityReply,
  ICommunitySetting,
} from '../types/index';

const multipartConfig = { headers: { 'Content-Type': 'multipart/form-data' } };

export const communityService = {
  getOverview: (params?: { channel?: string; archived?: boolean; dateFrom?: string; dateTo?: string; limit?: number; search?: string }) =>
    api.get<ICommunityOverview>('/community', { params }),
  getPost: (postId: string, params?: { archived?: boolean }) =>
    api.get<ICommunityPostDetail>(`/community/posts/${postId}`, { params }),
  getReplies: (postId: string, params?: { skip?: number; limit?: number }) =>
    api.get<{ replies: ICommunityReply[]; total: number; limit: number; skip: number; hasMore: boolean }>(
      `/community/posts/${postId}/replies`,
      { params }
    ),
  getAdminChannels: () => api.get<ICommunityChannel[]>('/community/admin/channels'),
  createChannel: (data: FormData) => api.post<ICommunityChannel>('/community/channels', data, multipartConfig),
  updateChannel: (id: string, data: FormData) => api.put<ICommunityChannel>(`/community/channels/${id}`, data, multipartConfig),
  archiveChannel: (id: string) => api.patch<ICommunityChannel>(`/community/channels/${id}/archive`),
  createPost: (data: FormData) => api.post<ICommunityPost>('/community/posts', data, multipartConfig),
  updatePost: (id: string, data: FormData) => api.put<ICommunityPost>(`/community/posts/${id}`, data, multipartConfig),
  createReply: (postId: string, data: FormData) =>
    api.post<ICommunityReply>(`/community/posts/${postId}/replies`, data, multipartConfig),
  reactToPost: (postId: string, type: CommunityReactionType) =>
    api.patch<ICommunityPost>(`/community/posts/${postId}/reactions`, { type }),
  reactToReply: (replyId: string, type: CommunityReactionType) =>
    api.patch<ICommunityReply>(`/community/replies/${replyId}/reactions`, { type }),
  toggleAcceptedReply: (replyId: string) => api.patch<ICommunityReply>(`/community/replies/${replyId}/accepted`),
  archiveReply: (replyId: string) => api.patch<{ _id: string }>(`/community/replies/${replyId}/archive`),
  archivePost: (postId: string) => api.patch<ICommunityPost>(`/community/posts/${postId}/archive`),
  togglePinnedPost: (postId: string) => api.patch<ICommunityPost>(`/community/posts/${postId}/pin`),
  getBadges: () => api.get<ICommunityBadge[]>('/community/badges'),
  createBadge: (data: FormData) => api.post<ICommunityBadge>('/community/badges', data, multipartConfig),
  updateBadge: (id: string, data: FormData) => api.put<ICommunityBadge>(`/community/badges/${id}`, data, multipartConfig),
  archiveBadge: (id: string) => api.patch<ICommunityBadge>(`/community/badges/${id}/archive`),
  getPointRules: () => api.get<ICommunityPointRule[]>('/community/point-rules'),
  updatePointRules: (rules: Array<{ key: ICommunityPointRule['key']; points: number }>) =>
    api.put<ICommunityPointRule[]>('/community/point-rules', { rules }),
  getSettings: () => api.get<ICommunitySetting>('/community/settings'),
  updateSettings: (data: FormData) => api.put<ICommunitySetting>('/community/settings', data, multipartConfig),
};
