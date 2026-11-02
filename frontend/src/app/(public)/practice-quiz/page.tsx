import { PracticeQuizPage } from '@/components/practice-quiz/PracticeQuizPage';
import { PageVisibilityGate } from '@/components/public/common/PageVisibilityGate';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Practice Quiz' };

// Hidden from the Site Pages screen: "Page not found"
const PracticeQuizRoute = () => (
  <PageVisibilityGate pageKey="practice-quiz">
    <PracticeQuizPage />
  </PageVisibilityGate>
);

export default PracticeQuizRoute;
