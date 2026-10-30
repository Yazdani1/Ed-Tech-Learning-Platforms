'use client';

import Box from '@mui/material/Box';
import { useMemo, useSyncExternalStore } from 'react';

import { sanitizeRichText } from '@/utils/sanitizeHtml';

import type { SxProps, Theme } from '@mui/material/styles';
import type { FC } from 'react';

interface SafeHtmlProps {
  /** Rich text from the TipTap editor (stored by the backend as HTML) */
  html: string;
  sx?: SxProps<Theme>;
}

const noSubscription = (): (() => void) => () => undefined;

/**
 * The only way user rich text reaches the page: sanitised with DOMPurify in the browser (it needs a DOM,
 * so the server render shows nothing and the sanitised HTML appears once the page is hydrated).
 * Allow-list in utils/sanitizeHtml.ts (formatting tags, http(s)/mailto links, text alignment only).
 */
export const SafeHtml: FC<SafeHtmlProps> = ({ html, sx }) => {
  const isBrowser = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  const clean = useMemo(() => (isBrowser ? sanitizeRichText(html) : ''), [html, isBrowser]);

  return (
    <Box sx={sx}>
      <Box
        sx={{ '& p': { my: 0.5 }, '& a': { color: 'primary.main' }, wordBreak: 'break-word' }}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    </Box>
  );
};
