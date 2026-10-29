import { MigratingPage } from '@/components/common/MigratingPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Courses' };

const AdminCoursesPage = () => <MigratingPage titleKey="nav.courses" />;

export default AdminCoursesPage;
