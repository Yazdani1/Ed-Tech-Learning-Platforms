import { StudentDashboard } from '@/components/student/StudentDashboard';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

const StudentDashboardPage = () => <StudentDashboard />;

export default StudentDashboardPage;
