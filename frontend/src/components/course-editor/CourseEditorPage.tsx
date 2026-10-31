'use client';

import { RequireRole } from '@/components/permissions/RequireRole';
import { MANAGER_ROLES } from '@/utils/roles';

import { CourseEditorScreen } from './CourseEditorScreen';
import { ExistingCourseEditor } from './ExistingCourseEditor';

import type { FC } from 'react';

interface CourseEditorPageProps {
  /** Course id from /admin/courses/[id]/edit; undefined on /admin/courses/create */
  courseId?: string;
}

/** Course editor (Super Admin, Admin: the backend's course write routes): create a course or edit one. */
export const CourseEditorPage: FC<CourseEditorPageProps> = ({ courseId }) => (
  <RequireRole roles={MANAGER_ROLES}>
    {courseId ? (
      <ExistingCourseEditor courseId={courseId} />
    ) : (
      <CourseEditorScreen course={undefined} />
    )}
  </RequireRole>
);
