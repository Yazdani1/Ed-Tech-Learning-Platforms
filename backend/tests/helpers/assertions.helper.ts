import type { Response } from 'supertest';

export const expectError = (
  response: Response,
  status: number,
  message?: string | RegExp,
): void => {
  expect(response.status).toBe(status);
  expect(response.body.success).toBe(false);
  if (message) expect(response.body.message).toEqual(expect.stringMatching(message));
};

export const expectSuccess = (response: Response, status = 200): void => {
  expect(response.status).toBe(status);
  expect(response.body.success).toBe(true);
};
