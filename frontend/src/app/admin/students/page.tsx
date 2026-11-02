import { StudentsPage } from '@/components/people/students/StudentsPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Students' };

const AdminStudentsPage = () => <StudentsPage />;

export default AdminStudentsPage;
