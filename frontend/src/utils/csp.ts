interface CspOptions {
  /** Fresh random value per request (proxy.ts); only scripts carrying it may run */
  nonce: string;
  isDev: boolean;
  /** Socket.io backend (NEXT_PUBLIC_SOCKET_URL): the browser connects to it directly */
  socketUrl: string;
}

/**
 * Content Security Policy for every page. Scripts need the per-request nonce ('strict-dynamic' lets
 * Next.js load its own chunks), so injected HTML cannot run script. Styles keep 'unsafe-inline': MUI writes
 * inline style attributes, which a nonce cannot cover. Dev mode needs 'unsafe-eval' (React debugging).
 */
export const buildCsp = ({ nonce, isDev, socketUrl }: CspOptions): string => {
  const socketOrigin = new URL(socketUrl).origin;
  const socketWsOrigin = socketOrigin.replace(/^http/, 'ws');
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com",
    "font-src 'self' data:",
    `connect-src 'self' ${socketOrigin} ${socketWsOrigin}${isDev ? ' ws:' : ''}`,
    "media-src 'self' https://res.cloudinary.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
};
