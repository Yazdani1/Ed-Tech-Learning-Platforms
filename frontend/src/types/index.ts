// Frontend-only TypeScript shapes. A leaf module: it never imports other frontend code.

export type UserRole = 'Super Admin' | 'Admin' | 'Moderator' | 'Teacher' | 'Student';

/** Every backend response: { success, message?, data?, total?, page?, limit? }. */
export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
  page?: number;
  limit?: number;
}

/** What list hooks return (the backend's data array plus its paging values). */
export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  timeoutMs?: number;
}
