import { MigratingPage } from '@/components/common/MigratingPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Assigned courses' };

const TeacherCoursesPage = () => <MigratingPage titleKey="nav.assignedCourses" />;

export default TeacherCoursesPage;
