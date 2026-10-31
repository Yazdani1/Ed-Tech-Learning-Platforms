import { LearnPage } from '@/components/learn/LearnPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Course Player' };

interface StudentCourseLearnPageProps {
  params: Promise<{ courseId: string }>;
}

const StudentCourseLearnPage = async ({ params }: StudentCourseLearnPageProps) => {
  const { courseId } = await params;
  return <LearnPage courseId={courseId} area="student" />;
};

export default StudentCourseLearnPage;
