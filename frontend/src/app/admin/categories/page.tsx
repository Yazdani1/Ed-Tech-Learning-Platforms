import { CourseSetupPage } from '@/components/setup/CourseSetupPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Course Setup' };

const AdminCategoriesPage = () => <CourseSetupPage kind="category" />;

export default AdminCategoriesPage;
