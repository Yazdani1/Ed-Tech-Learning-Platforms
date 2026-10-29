import { http as mock, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { fail, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';

import {
  type ApiError,
  http,
  isApiError,
  NETWORK_ERROR_STATUS,
  UNEXPECTED_RESPONSE_STATUS,
} from '../http.service';

const itemSchema = z.object({ _id: z.string(), title: z.string() });

/** The ApiError a request rejects with (fails the test if it resolves or rejects with anything else). */
const apiErrorOf = async (request: Promise<unknown>): Promise<ApiError> => {
  const error = await request.then(
    () => null,
    (reason: unknown) => reason,
  );
  if (!isApiError(error)) throw new Error('expected the request to reject with an ApiError');
  return error;
};

describe('http service', () => {
  it("resolves with the envelope's data, checked against the schema", async () => {
    server.use(mock.get('*/api/items/1', () => ok({ _id: '1', title: 'Algebra', extra: true })));

    await expect(http.get('/api/items/1', itemSchema)).resolves.toEqual({
      _id: '1',
      title: 'Algebra',
    });
  });

  it('sends the body and returns the created item', async () => {
    let received: unknown;
    server.use(
      mock.post('*/api/items', async ({ request }) => {
        received = await request.json();
        return ok({ _id: '2', title: 'Physics' });
      }),
    );

    await expect(http.post('/api/items', { title: 'Physics' }, itemSchema)).resolves.toEqual({
      _id: '2',
      title: 'Physics',
    });
    expect(received).toEqual({ title: 'Physics' });
  });

  it("turns the backend's { success: false, message } into an ApiError with that message", async () => {
    server.use(mock.get('*/api/items/9', () => fail(404, 'Course not found')));

    const error = await apiErrorOf(http.get('/api/items/9', itemSchema));
    expect(error.status).toBe(404);
    expect(error.message).toBe('Course not found');
  });

  it('uses a friendly message when the error body has none', async () => {
    server.use(mock.get('*/api/items/9', () => new HttpResponse(null, { status: 500 })));

    const error = await apiErrorOf(http.get('/api/items/9', itemSchema));
    expect(error.status).toBe(500);
    expect(error.message).toBe('Something went wrong. Please try again.');
  });

  it('reports an unexpected response shape as an ApiError (never a raw Zod error)', async () => {
    server.use(mock.get('*/api/items/1', () => ok({ id: 1 })));

    const error = await apiErrorOf(http.get('/api/items/1', itemSchema));
    expect(error.status).toBe(UNEXPECTED_RESPONSE_STATUS);
  });

  it('treats success: false with a 200 status as an error', async () => {
    server.use(
      mock.get('*/api/items/1', () =>
        HttpResponse.json({ success: false, message: 'Not allowed' }),
      ),
    );

    const error = await apiErrorOf(http.get('/api/items/1', itemSchema));
    expect(error.message).toBe('Not allowed');
  });

  it('reports an unreachable server as a network error', async () => {
    server.use(mock.get('*/api/items/1', () => HttpResponse.error()));

    const error = await apiErrorOf(http.get('/api/items/1', itemSchema));
    expect(error.status).toBe(NETWORK_ERROR_STATUS);
    expect(error.message).toMatch(/Cannot reach the server/);
  });

  it('returns list items with the paging values', async () => {
    server.use(
      mock.get('*/api/items', () =>
        ok([{ _id: '1', title: 'A' }], { total: 21, page: 2, limit: 10 }),
      ),
    );

    await expect(http.list('/api/items', itemSchema)).resolves.toEqual({
      items: [{ _id: '1', title: 'A' }],
      total: 21,
      page: 2,
      limit: 10,
    });
  });

  it('send returns the whole envelope (for calls without data)', async () => {
    server.use(
      mock.post('*/api/auth/logout', () =>
        HttpResponse.json({ success: true, message: 'Logged out successfully' }),
      ),
    );

    await expect(http.send('POST', '/api/auth/logout')).resolves.toEqual({
      success: true,
      message: 'Logged out successfully',
    });
  });
});
