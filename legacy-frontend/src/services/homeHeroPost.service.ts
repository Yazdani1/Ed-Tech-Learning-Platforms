import api from './api';
import type { IHomeHeroPost, ISiteLogo } from '../types/index';

export const homeHeroPostService = {
	getPublic: () => api.get<IHomeHeroPost[]>('/home-hero-posts/public'),
	getAll: () => api.get<IHomeHeroPost[]>('/home-hero-posts'),
	getPublicLogo: () => api.get<ISiteLogo | null>('/home-hero-posts/logo/public'),
	getLogo: () => api.get<ISiteLogo | null>('/home-hero-posts/logo'),
	updateLogo: (data: FormData) =>
		api.put<ISiteLogo>('/home-hero-posts/logo', data, {
			headers: { 'Content-Type': 'multipart/form-data' },
		}),
	create: (data: FormData) =>
		api.post<IHomeHeroPost[]>('/home-hero-posts', data, {
			headers: { 'Content-Type': 'multipart/form-data' },
		}),
	update: (id: string, data: FormData) =>
		api.put<IHomeHeroPost>(`/home-hero-posts/${id}`, data, {
			headers: { 'Content-Type': 'multipart/form-data' },
		}),
	reorder: (orderedIds: string[]) => api.patch('/home-hero-posts/reorder', { orderedIds }),
	delete: (id: string) => api.delete(`/home-hero-posts/${id}`),
};
