import { notFound } from '../../../src/middleware/notFound';

describe('notFound middleware', () => {
  it('returns a consistent JSON 404 response', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    notFound({} as never, res as never);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Route not found' });
  });
});
