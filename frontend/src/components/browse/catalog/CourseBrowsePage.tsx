import Container from '@mui/material/Container';
import { Suspense } from 'react';

import { CourseGridSkeleton } from '../card/CourseGridSkeleton';

import { CourseBrowseView } from './CourseBrowseView';

const FALLBACK_CARDS = 8;

/** The catalog reads its filters from the URL (useSearchParams), so it renders inside Suspense. */
export const CourseBrowsePage = () => (
  <Suspense
    fallback={
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <CourseGridSkeleton count={FALLBACK_CARDS} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }} />
      </Container>
    }
  >
    <CourseBrowseView />
  </Suspense>
);
