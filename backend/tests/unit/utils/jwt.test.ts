import jwt from 'jsonwebtoken';
import { generateToken } from '../../../src/utils/jwt';

describe('JWT utilities', () => {
  it('signs tokens with the configured secret and user id payload', () => {
    const token = generateToken('user-123');
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

    expect(decoded.id).toBe('user-123');
  });
});
