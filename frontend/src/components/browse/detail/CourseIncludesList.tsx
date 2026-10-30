'use client';

import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import DevicesIcon from '@mui/icons-material/Devices';
import EventIcon from '@mui/icons-material/Event';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { IconTextList } from './IconTextList';

import type { FC } from 'react';

interface CourseIncludesListProps {
  lectureCount: number;
  liveClassPlanCount: number;
}

/** "This course includes": lectures, live class plans, lifetime access, devices, certificate. */
export const CourseIncludesList: FC<CourseIncludesListProps> = ({
  lectureCount,
  liveClassPlanCount,
}) => {
  const { t } = useTranslation();
  const items = [
    {
      icon: <OndemandVideoIcon fontSize="small" />,
      text: t('browse.detail.includesLectures', { count: lectureCount }),
    },
    ...(liveClassPlanCount > 0
      ? [
          {
            icon: <EventIcon fontSize="small" />,
            text: t('browse.detail.includesLivePlans', { count: liveClassPlanCount }),
          },
        ]
      : []),
    { icon: <AllInclusiveIcon fontSize="small" />, text: t('browse.detail.lifetime') },
    { icon: <DevicesIcon fontSize="small" />, text: t('browse.detail.allDevices') },
    { icon: <WorkspacePremiumIcon fontSize="small" />, text: t('browse.detail.certificate') },
  ];
  return (
    <Box component="section" sx={{ mb: 4 }}>
      <Typography component="h2" variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        {t('browse.detail.includes')}
      </Typography>
      <Box sx={{ columnCount: { xs: 1, sm: 2 } }}>
        <IconTextList items={items} />
      </Box>
    </Box>
  );
};
