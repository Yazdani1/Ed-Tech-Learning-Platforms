import { CourseEditorPage } from '@/components/course-editor/CourseEditorPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Create Course' };

const AdminCourseCreatePage = () => <CourseEditorPage />;

export default AdminCourseCreatePage;
