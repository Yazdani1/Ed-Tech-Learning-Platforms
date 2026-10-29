import { describe, expect, it } from 'vitest';

import { buildCsp } from '../csp';

const directive = (csp: string, name: string): string | undefined =>
  csp.split('; ').find((part) => part.startsWith(`${name} `) || part === name);

describe('buildCsp', () => {
  const production = buildCsp({
    nonce: 'abc123',
    isDev: false,
    socketUrl: 'https://api.example.com',
  });

  it('only runs scripts that carry the nonce (no unsafe-inline, no eval in production)', () => {
    expect(directive(production, 'script-src')).toBe(
      "script-src 'self' 'nonce-abc123' 'strict-dynamic'",
    );
  });

  it('lets the browser reach the Socket.io backend over https and wss only', () => {
    expect(directive(production, 'connect-src')).toBe(
      "connect-src 'self' https://api.example.com wss://api.example.com",
    );
  });

  it('blocks framing, plugins and foreign form targets, and upgrades http', () => {
    expect(production).toContain("frame-ancestors 'none'");
    expect(production).toContain("object-src 'none'");
    expect(production).toContain("form-action 'self'");
    expect(production).toContain('upgrade-insecure-requests');
  });

  it('allows eval and dev websockets only in development', () => {
    const dev = buildCsp({ nonce: 'n', isDev: true, socketUrl: 'http://localhost:5000' });
    expect(directive(dev, 'script-src')).toContain("'unsafe-eval'");
    expect(directive(dev, 'connect-src')).toBe(
      "connect-src 'self' http://localhost:5000 ws://localhost:5000 ws:",
    );
    expect(dev).not.toContain('upgrade-insecure-requests');
  });
});
