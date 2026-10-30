'use client';

import SchoolIcon from '@mui/icons-material/School';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useUnenroll } from '@/api/catalog.api';
import { useConfirm } from '@/hooks/useConfirm';
import { formatDateTime } from '@/utils/dateTime';

import { IconTextList, type IconTextItem } from '../IconTextList';

import type { FC } from 'react';

interface EnrolledActionsProps {
  courseId: string;
  enrolledAt: string | null | undefined;
  highlights: readonly IconTextItem[];
}

/** An enrolled student: "Go to this course" (the course player), enrolment date, and leaving the course. */
export const EnrolledActions: FC<EnrolledActionsProps> = ({ courseId, enrolledAt, highlights }) => {
  const { t, i18n } = useTranslation();
  const confirm = useConfirm();
  const unenroll = useUnenroll();

  const leave = async (): Promise<void> => {
    const ok = await confirm({
      title: t('browse.enroll.leaveTitle'),
      message: t('browse.enroll.leaveMessage'),
      confirmLabel: t('browse.enroll.leave'),
      destructive: true,
    });
    if (!ok) return;
    unenroll.mutate(courseId, {
      onSuccess: () => toast.success(t('browse.enroll.left')),
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <>
      <Button
        component={Link}
        href={`/student/courses/${courseId}/learn`}
        fullWidth
        variant="contained"
        size="large"
        color="success"
        startIcon={<SchoolIcon />}
        sx={{ fontWeight: 700, borderRadius: 2 }}
      >
        {t('browse.enroll.goToCourse')}
      </Button>
      {enrolledAt && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('browse.enroll.enrolledOn', { date: formatDateTime(enrolledAt, i18n.language) })}
        </Typography>
      )}
      <Box sx={{ mt: 2 }}>
        <IconTextList items={highlights} />
      </Box>
      <Button
        fullWidth
        color="error"
        disabled={unenroll.isPending}
        onClick={() => void leave()}
        sx={{ mt: 1, minHeight: 44 }}
      >
        {t('browse.enroll.leave')}
      </Button>
    </>
  );
};
