import { AdminEnrollmentsPage as AdminEnrollmentsScreen } from '@/components/admin-courses/enrollments/AdminEnrollmentsPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Course enrollments' };

interface AdminEnrollmentsPageProps {
  params: Promise<{ courseId: string }>;
}

const AdminEnrollmentsPage = async ({ params }: AdminEnrollmentsPageProps) => {
  const { courseId } = await params;
  return <AdminEnrollmentsScreen courseId={courseId} />;
};

export default AdminEnrollmentsPage;
