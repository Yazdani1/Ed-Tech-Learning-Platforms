import { LearnPage } from '@/components/learn/LearnPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Course Player' };

interface AdminCourseLearnPageProps {
  params: Promise<{ id: string }>;
}

const AdminCourseLearnPage = async ({ params }: AdminCourseLearnPageProps) => {
  const { id } = await params;
  return <LearnPage courseId={id} area="admin" />;
};

export default AdminCourseLearnPage;
