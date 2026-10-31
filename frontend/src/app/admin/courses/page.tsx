import { AdminCoursesPage as AdminCoursesScreen } from '@/components/admin-courses/list/AdminCoursesPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Courses' };

const AdminCoursesPage = () => <AdminCoursesScreen />;

export default AdminCoursesPage;
