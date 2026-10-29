import { MigratingPage } from '@/components/common/MigratingPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

const StudentDashboardPage = () => <MigratingPage titleKey="nav.dashboard" />;

export default StudentDashboardPage;
