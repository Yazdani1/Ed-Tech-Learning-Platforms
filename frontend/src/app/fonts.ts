import { Hind_Siliguri, Space_Grotesk, Space_Mono } from 'next/font/google';

// Self-hosted by next/font (the browser never calls Google, so the CSP stays 'self').
// They only define CSS variables; components use them through theme/fonts.ts.
const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const mono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
});
const bangla = Hind_Siliguri({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bangla',
  display: 'swap',
  // Only Bangla readers need it: not preloaded on every English page
  preload: false,
});

/** Put on <html>: makes the font variables available everywhere. */
export const FONT_VARIABLES = `${display.variable} ${mono.variable} ${bangla.variable}`;
