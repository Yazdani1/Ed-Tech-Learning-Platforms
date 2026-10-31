import { CourseEditorPage } from '@/components/course-editor/CourseEditorPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Edit Course' };

interface AdminCourseEditPageProps {
  params: Promise<{ id: string }>;
}

const AdminCourseEditPage = async ({ params }: AdminCourseEditPageProps) => {
  const { id } = await params;
  return <CourseEditorPage courseId={id} />;
};

export default AdminCourseEditPage;
