import { AdminCourseDetail } from '@/components/admin-courses/detail/AdminCourseDetail';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Course details' };

interface AdminCourseDetailPageProps {
  params: Promise<{ id: string }>;
}

const AdminCourseDetailPage = async ({ params }: AdminCourseDetailPageProps) => {
  const { id } = await params;
  return <AdminCourseDetail courseId={id} />;
};

export default AdminCourseDetailPage;
