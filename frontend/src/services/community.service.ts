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
} from '../types/index';

const multipartConfig = { headers: { 'Content-Type': 'multipart/form-data' } };

export const communityService = {
  getOverview: (params?: { channel?: string; archived?: boolean; dateFrom?: string; dateTo?: string }) =>
    api.get<ICommunityOverview>('/community', { params }),
  getPost: (postId: string, params?: { archived?: boolean }) =>
    api.get<ICommunityPostDetail>(`/community/posts/${postId}`, { params }),
  getAdminChannels: () => api.get<ICommunityChannel[]>('/community/admin/channels'),
  createChannel: (data: FormData) => api.post<ICommunityChannel>('/community/channels', data, multipartConfig),
  updateChannel: (id: string, data: FormData) => api.put<ICommunityChannel>(`/community/channels/${id}`, data, multipartConfig),
  archiveChannel: (id: string) => api.patch<ICommunityChannel>(`/community/channels/${id}/archive`),
  createPost: (data: FormData) => api.post<ICommunityPost>('/community/posts', data, multipartConfig),
  updatePost: (id: string, data: FormData) => api.put<ICommunityPost>(`/community/posts/${id}`, data, multipartConfig),
  createReply: (postId: string, body: string) => api.post<ICommunityReply>(`/community/posts/${postId}/replies`, { body }),
  reactToPost: (postId: string, type: CommunityReactionType) =>
    api.patch<ICommunityPost>(`/community/posts/${postId}/reactions`, { type }),
  reactToReply: (replyId: string, type: CommunityReactionType) =>
    api.patch<ICommunityReply>(`/community/replies/${replyId}/reactions`, { type }),
  toggleAcceptedReply: (replyId: string) => api.patch<ICommunityReply>(`/community/replies/${replyId}/accepted`),
  archivePost: (postId: string) => api.patch<ICommunityPost>(`/community/posts/${postId}/archive`),
  togglePinnedPost: (postId: string) => api.patch<ICommunityPost>(`/community/posts/${postId}/pin`),
  getBadges: () => api.get<ICommunityBadge[]>('/community/badges'),
  createBadge: (data: { name: string; icon: string; requiredPoints: number; description?: string }) =>
    api.post<ICommunityBadge>('/community/badges', data),
  updateBadge: (id: string, data: Partial<{ name: string; icon: string; requiredPoints: number; description: string }>) =>
    api.put<ICommunityBadge>(`/community/badges/${id}`, data),
  archiveBadge: (id: string) => api.patch<ICommunityBadge>(`/community/badges/${id}/archive`),
  getPointRules: () => api.get<ICommunityPointRule[]>('/community/point-rules'),
  updatePointRules: (rules: Array<{ key: ICommunityPointRule['key']; points: number }>) =>
    api.put<ICommunityPointRule[]>('/community/point-rules', { rules }),
};
