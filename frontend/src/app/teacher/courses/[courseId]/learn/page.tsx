import { LearnPage } from '@/components/learn/LearnPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Course Player' };

interface TeacherCourseLearnPageProps {
  params: Promise<{ courseId: string }>;
}

const TeacherCourseLearnPage = async ({ params }: TeacherCourseLearnPageProps) => {
  const { courseId } = await params;
  return <LearnPage courseId={courseId} area="teacher" />;
};

export default TeacherCourseLearnPage;
