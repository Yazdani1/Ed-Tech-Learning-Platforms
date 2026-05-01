import axios, { type AxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import type { ApiResponse } from '../types/index';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// URLs where errors should be silently swallowed (no toast, no redirect)
const SILENT_URLS = ['/auth/me', '/enrollments'];

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const url = error.config?.url ?? '';
      const isSilent = SILENT_URLS.some((u) => url.includes(u));

      if (!isSilent) {
        const message = (error.response?.data as { message?: string })?.message ?? 'Something went wrong';
        toast.error(message);
        if (error.response?.status === 401) {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    axiosInstance.get<ApiResponse<T>>(url, config).then((r) => r.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    axiosInstance.post<ApiResponse<T>>(url, data, config).then((r) => r.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    axiosInstance.put<ApiResponse<T>>(url, data, config).then((r) => r.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    axiosInstance.patch<ApiResponse<T>>(url, data, config).then((r) => r.data),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    axiosInstance.delete<ApiResponse<T>>(url, config).then((r) => r.data),
};

export default api;
