import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { Suspense } from 'react';

import { PracticeQuizView } from './PracticeQuizView';

const FALLBACK_HEIGHT = 480;

/** The practice page reads the chosen course and bank from the URL (useSearchParams), so it renders inside Suspense. */
export const PracticeQuizPage = () => (
  <Suspense
    fallback={
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rounded" height={FALLBACK_HEIGHT} />
      </Box>
    }
  >
    <PracticeQuizView />
  </Suspense>
);
