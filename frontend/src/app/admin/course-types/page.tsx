import { CourseSetupPage } from '@/components/setup/CourseSetupPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Course Types' };

const AdminCourseTypesPage = () => <CourseSetupPage kind="courseType" />;

export default AdminCourseTypesPage;
