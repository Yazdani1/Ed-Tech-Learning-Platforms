import api from './api';
import type { IGroupChatChannel, IGroupChatMessage, IUser } from '../types/index';

export const groupChatService = {
	getChannels: (params?: { search?: string; archived?: boolean }) =>
		api.get<IGroupChatChannel[]>('/group-chat/channels', { params }),
	discoverChannels: (params?: { search?: string }) =>
		api.get<IGroupChatChannel[]>('/group-chat/channels/discover', { params }),
	createChannel: (data: { name: string; description?: string; type: 'Public' | 'Private' }) =>
		api.post<IGroupChatChannel>('/group-chat/channels', data),
	updateChannel: (channelId: string, data: { name: string; description?: string; type: 'Public' | 'Private' }) =>
		api.patch<IGroupChatChannel>(`/group-chat/channels/${channelId}`, data),
	searchUsers: (search: string) =>
		api.get<Array<Pick<IUser, '_id' | 'name' | 'avatar' | 'role' | 'email'>>>('/group-chat/users/search', { params: { search } }),
	joinChannel: (channelId: string) => api.post<IGroupChatChannel>(`/group-chat/channels/${channelId}/join`),
	approveJoinRequest: (channelId: string, userId: string) =>
		api.post<IGroupChatChannel>(`/group-chat/channels/${channelId}/approve/${userId}`),
	addMembers: (channelId: string, userIds: string[]) =>
		api.post<IGroupChatChannel>(`/group-chat/channels/${channelId}/members`, { userIds }),
	removeMember: (channelId: string, userId: string) =>
		api.delete<IGroupChatChannel>(`/group-chat/channels/${channelId}/members/${userId}`),
	leaveChannel: (channelId: string) => api.post(`/group-chat/channels/${channelId}/leave`),
	archiveChannel: (channelId: string) => api.patch<IGroupChatChannel>(`/group-chat/channels/${channelId}/archive`),
	toggleBlockChannel: (channelId: string) => api.patch<IGroupChatChannel>(`/group-chat/channels/${channelId}/block`),
	getMessages: (channelId: string) => api.get<IGroupChatMessage[]>(`/group-chat/channels/${channelId}/messages`),
	createMessage: (channelId: string, data: FormData) =>
		api.post<IGroupChatMessage>(`/group-chat/channels/${channelId}/messages`, data, {
			headers: { 'Content-Type': 'multipart/form-data' },
		}),
	markRead: (channelId: string) => api.patch(`/group-chat/channels/${channelId}/read`),
};
