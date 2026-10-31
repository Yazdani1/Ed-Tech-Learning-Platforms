import { TeacherCoursesPage as TeacherCourses } from '@/components/teacher/TeacherCoursesPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Assigned courses' };

const TeacherCoursesPage = () => <TeacherCourses />;

export default TeacherCoursesPage;
