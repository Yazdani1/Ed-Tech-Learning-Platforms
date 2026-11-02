import { CourseSetupPage } from '@/components/setup/CourseSetupPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Tools' };

const AdminToolsPage = () => <CourseSetupPage kind="tool" />;

export default AdminToolsPage;
