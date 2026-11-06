'use client';

import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { ActionMenu } from '@/components/common/ActionMenu';

import type { AdminCourse } from '@/schemas/admin-courses.schema';
import type { FC } from 'react';

interface CourseCardMenuProps {
  course: AdminCourse;
  /** Super Admin / Admin: delete (the backend allows nobody else) */
  canManage: boolean;
  busy: boolean;
  onDelete: (course: AdminCourse) => void;
}

/**
 * "⋮" menu of a course card: details, enrolments and (managers) delete — only for a course that was never
 * published. Publishing and unpublishing are in the course editor (header and Settings).
 */
export const CourseCardMenu: FC<CourseCardMenuProps> = ({ course, canManage, busy, onDelete }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const everPublished = course.status === 'Published' || Boolean(course.firstPublishedAt);

  return (
    <ActionMenu
      label={t('adminCourses.list.actionsFor', { title: course.title })}
      items={[
        {
          label: t('adminCourses.list.viewDetails'),
          icon: <InfoOutlinedIcon fontSize="small" />,
          onClick: () => {
            router.push(`/admin/courses/${course._id}`);
          },
        },
        {
          label: t('adminCourses.list.enrollments'),
          icon: <PeopleAltOutlinedIcon fontSize="small" />,
          onClick: () => {
            router.push(`/admin/enrollments/${course._id}`);
          },
        },
        {
          label: t('adminCourses.list.delete'),
          icon: <DeleteOutlinedIcon fontSize="small" />,
          onClick: () => {
            onDelete(course);
          },
          danger: true,
          visible: canManage && !everPublished,
          disabled: busy,
        },
      ]}
    />
  );
};
