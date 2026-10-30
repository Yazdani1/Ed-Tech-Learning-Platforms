import { FreeCoursesView } from '@/components/browse/free/FreeCoursesView';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Free Courses' };

const FreeCoursesPage = () => <FreeCoursesView />;

export default FreeCoursesPage;
