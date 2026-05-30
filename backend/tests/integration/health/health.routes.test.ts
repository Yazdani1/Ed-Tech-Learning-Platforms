import request from 'supertest';
import app from '../../../src/app';
import { expectSuccess } from '../../helpers/assertions.helper';

describe('Health API', () => {
  it('returns service health metadata', async () => {
    const res = await request(app).get('/api/health');

    expectSuccess(res);
    expect(res.body.message).toBe('Ed-Tech API is running');
    expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
  });
});
