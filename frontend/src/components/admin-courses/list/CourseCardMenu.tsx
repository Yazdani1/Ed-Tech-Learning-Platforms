'use client';

import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedOutlinedIcon from '@mui/icons-material/UnpublishedOutlined';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { ActionMenu } from '@/components/common/ActionMenu';

import type { AdminCourse } from '@/schemas/admin-courses.schema';
import type { FC } from 'react';

interface CourseCardMenuProps {
  course: AdminCourse;
  /** Super Admin / Admin: publish, unpublish and delete (the backend allows nobody else) */
  canManage: boolean;
  busy: boolean;
  onToggleStatus: (course: AdminCourse) => void;
  onDelete: (course: AdminCourse) => void;
}

/** "⋮" menu of a course card: details, enrolments and (managers) publish / unpublish / delete. */
export const CourseCardMenu: FC<CourseCardMenuProps> = ({
  course,
  canManage,
  busy,
  onToggleStatus,
  onDelete,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const published = course.status === 'Published';

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
          label: t(published ? 'adminCourses.list.unpublish' : 'adminCourses.list.publish'),
          icon: published ? (
            <UnpublishedOutlinedIcon fontSize="small" />
          ) : (
            <PublishIcon fontSize="small" />
          ),
          onClick: () => {
            onToggleStatus(course);
          },
          visible: canManage,
          disabled: busy,
        },
        {
          label: t('adminCourses.list.delete'),
          icon: <DeleteOutlinedIcon fontSize="small" />,
          onClick: () => {
            onDelete(course);
          },
          danger: true,
          visible: canManage,
          disabled: busy,
        },
      ]}
    />
  );
};
