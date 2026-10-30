import { Suspense } from 'react';

import { CourseCardSkeletons } from '@/components/student/CourseCardSkeletons';
import { MyCoursesPage } from '@/components/student/MyCoursesPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Courses' };

// Suspense: the search box is kept in the URL (useSearchParams)
const StudentCoursesPage = () => (
  <Suspense fallback={<CourseCardSkeletons />}>
    <MyCoursesPage />
  </Suspense>
);

export default StudentCoursesPage;
