import type { TeacherCourse } from '@/schemas/teacher.schema';

/** "Ms Rahman, Mr Karim" (deleted teachers are left out). */
export const teacherNames = (course: TeacherCourse): string =>
  course.teachers.flatMap((teacher) => (teacher ? [teacher.name] : [])).join(', ');

/** The course player for teachers (built by the course player feature). */
export const teacherLearnPath = (courseId: string): string =>
  `/teacher/courses/${encodeURIComponent(courseId)}/learn`;
