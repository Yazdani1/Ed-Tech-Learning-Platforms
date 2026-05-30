import jwt from 'jsonwebtoken';
import { clearTokenCookie, generateToken } from '../../../src/utils/jwt';

describe('JWT utilities', () => {
  it('signs tokens with the configured secret and user id payload', () => {
    const token = generateToken('user-123');
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

    expect(decoded.id).toBe('user-123');
  });

  it('clears the auth cookie with an expired token value', () => {
    const res = { cookie: jest.fn() };

    clearTokenCookie(res as never);

    expect(res.cookie).toHaveBeenCalledWith(
      'token',
      '',
      expect.objectContaining({
        httpOnly: true,
        expires: new Date(0),
      })
    );
  });
});
