import axios, { type AxiosRequestConfig, type Method } from 'axios';
import { z } from 'zod';

import i18n from '@/i18n/i18n';

import type { ApiEnvelope, ListResult, RequestOptions } from '@/types';

const REQUEST_TIMEOUT_MS = 15_000;
/** Status of an ApiError when the server was not reached (offline, timeout, server down). */
export const NETWORK_ERROR_STATUS = 0;

/**
 * The one error type every request rejects with. `message` is ready to show to the user: the backend's own
 * message ({ success: false, message }), or a translated network/unknown error.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Calls the backend on the same origin (`/api/...`, rewritten to the backend by next.config.ts).
 * The session is the backend's httpOnly cookie, sent by the browser automatically: this code never
 * sees a token.
 */
const client = axios.create({
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
});

const backendMessage = (body: unknown): string | null => {
  if (typeof body !== 'object' || body === null || !('message' in body)) return null;
  const { message } = body;
  return typeof message === 'string' && message.trim() !== '' ? message : null;
};

const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;
  if (!axios.isAxiosError(error))
    return new ApiError(NETWORK_ERROR_STATUS, i18n.t('errors.unknown'));
  if (!error.response) return new ApiError(NETWORK_ERROR_STATUS, i18n.t('errors.network'));
  const body: unknown = error.response.data;
  return new ApiError(error.response.status, backendMessage(body) ?? i18n.t('errors.unknown'));
};

/** Sends one request and returns the backend's envelope; every failure becomes an ApiError. */
async function send<T>(
  method: Method,
  url: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  const config: AxiosRequestConfig = {
    method,
    url,
    data: body,
    params: options.params,
    ...(options.timeoutMs !== undefined && { timeout: options.timeoutMs }),
    ...(options.signal && { signal: options.signal }),
  };
  try {
    const response = await client.request<ApiEnvelope<T>>(config);
    if (!response.data.success) {
      throw new ApiError(
        response.status,
        backendMessage(response.data) ?? i18n.t('errors.unknown'),
      );
    }
    return response.data;
  } catch (error) {
    // Cancelled requests (TanStack Query aborting a stale query) are not errors to show
    if (axios.isCancel(error)) throw error;
    throw toApiError(error);
  }
}

/** Status of an ApiError when the backend answered with a shape the app does not expect. */
export const UNEXPECTED_RESPONSE_STATUS = 502;

/** Checks the envelope's `data` against the feature's Zod schema; a mismatch becomes an ApiError. */
const parseData = <S extends z.ZodType>(schema: S, data: unknown): z.infer<S> => {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new ApiError(UNEXPECTED_RESPONSE_STATUS, i18n.t('errors.unknown'));
  return parsed.data;
};

/**
 * Central HTTP client. Every API file (src/api/<feature>.api.ts) calls these; components never do.
 * get/post/put/patch/delete resolve with the envelope's `data`, checked against a Zod schema from
 * src/schemas; `list` adds the paging values; `send` returns the whole envelope unchecked (for calls whose
 * response has no data, such as logout).
 */
export const http = {
  get: async <S extends z.ZodType>(url: string, schema: S, options?: RequestOptions) =>
    parseData(schema, (await send<unknown>('GET', url, undefined, options)).data),
  post: async <S extends z.ZodType>(
    url: string,
    body: unknown,
    schema: S,
    options?: RequestOptions,
  ) => parseData(schema, (await send<unknown>('POST', url, body, options)).data),
  put: async <S extends z.ZodType>(
    url: string,
    body: unknown,
    schema: S,
    options?: RequestOptions,
  ) => parseData(schema, (await send<unknown>('PUT', url, body, options)).data),
  patch: async <S extends z.ZodType>(
    url: string,
    body: unknown,
    schema: S,
    options?: RequestOptions,
  ) => parseData(schema, (await send<unknown>('PATCH', url, body, options)).data),
  delete: async <S extends z.ZodType>(url: string, schema: S, options?: RequestOptions) =>
    parseData(schema, (await send<unknown>('DELETE', url, undefined, options)).data),
  list: async <S extends z.ZodType>(
    url: string,
    itemSchema: S,
    options?: RequestOptions,
  ): Promise<ListResult<z.infer<S>>> => {
    const envelope = await send<unknown>('GET', url, undefined, options);
    const items = parseData(z.array(itemSchema), envelope.data ?? []);
    return {
      items,
      total: envelope.total ?? items.length,
      page: envelope.page ?? 1,
      limit: envelope.limit ?? items.length,
    };
  },
  /**
   * GET whose envelope carries more than data/total/page/limit (e.g. pagination, counts): the whole
   * envelope (minus success) is checked against the schema.
   */
  getEnvelope: async <S extends z.ZodType>(
    url: string,
    envelopeSchema: S,
    options?: RequestOptions,
  ) => parseData(envelopeSchema, await send<unknown>('GET', url, undefined, options)),
  send: (method: Method, url: string, body?: unknown, options?: RequestOptions) =>
    send<unknown>(method, url, body, options),
};

/** True when the error is an ApiError (optionally with this HTTP status). */
export const isApiError = (error: unknown, status?: number): error is ApiError =>
  error instanceof ApiError && (status === undefined || error.status === status);
