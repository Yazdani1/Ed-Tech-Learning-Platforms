import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';

describe('GET /api/health', () => {
  it('answers 200 for anyone (no sign-in needed)', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: 'Ed-Tech API is running' });
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('answers 404 in the standard error shape for an unknown /api path', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
