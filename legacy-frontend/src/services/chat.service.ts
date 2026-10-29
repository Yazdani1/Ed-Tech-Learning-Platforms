import api from './api';
import type { IChatConversation, IChatMessage } from '../types';

export const chatService = {
	// Staff: returns IChatConversation[]; Student: returns IChatConversation
	getConversations: () => api.get<IChatConversation[] | IChatConversation>('/chat/conversations'),
	getMessages: (conversationId: string) =>
		api.get<IChatMessage[]>(`/chat/conversations/${conversationId}/messages`),
};
