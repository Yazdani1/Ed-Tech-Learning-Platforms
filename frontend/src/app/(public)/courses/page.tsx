import { CourseBrowsePage } from '@/components/browse/catalog/CourseBrowsePage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'All Courses' };

const CoursesPage = () => <CourseBrowsePage />;

export default CoursesPage;
