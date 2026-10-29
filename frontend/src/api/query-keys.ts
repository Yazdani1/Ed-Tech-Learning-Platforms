/** Every TanStack Query key in one place, so invalidation never misses a spelling. */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
};
