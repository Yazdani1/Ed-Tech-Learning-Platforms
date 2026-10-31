import { z } from 'zod';

import { http } from '@/services/http.service';

const socketTokenSchema = z.object({ token: z.string().min(1) });

/** The session token for Socket.io, read from the httpOnly cookie by the app's own route (memory only). */
export const getSocketToken = async (): Promise<string> =>
  (await http.get('/api/socket-token', socketTokenSchema)).token;
