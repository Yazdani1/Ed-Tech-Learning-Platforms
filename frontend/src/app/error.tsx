'use client';

import { ErrorView } from '@/components/errors/ErrorView';

import type { FC } from 'react';

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Error boundary inside the root layout: the theme, translations and providers still work here.
// A crash of the root layout itself goes to global-error.tsx.
const RootError: FC<RootErrorProps> = ({ error, reset }) => (
  <ErrorView onRetry={reset} digest={error.digest} />
);

export default RootError;
