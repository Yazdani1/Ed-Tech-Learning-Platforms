import { CourseDetailView } from '@/components/browse/detail/CourseDetailView';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Course details' };

interface CourseDetailPageProps {
  params: Promise<{ id: string }>;
}

const CourseDetailPage = async ({ params }: CourseDetailPageProps) => {
  const { id } = await params;
  return <CourseDetailView courseId={id} />;
};

export default CourseDetailPage;
