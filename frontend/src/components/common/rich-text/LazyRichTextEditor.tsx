'use client';

import Skeleton from '@mui/material/Skeleton';
import dynamic from 'next/dynamic';

const EDITOR_SKELETON_HEIGHT = 160;

/** The TipTap editor, loaded in the browser only when a form needs it (it is heavy and needs the DOM). */
export const LazyRichTextEditor = dynamic(() => import('./RichTextEditor'), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" height={EDITOR_SKELETON_HEIGHT} />,
});
