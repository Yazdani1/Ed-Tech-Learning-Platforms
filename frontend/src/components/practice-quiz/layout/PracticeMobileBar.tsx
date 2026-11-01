'use client';

import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import { useTranslation } from 'react-i18next';

import type { FC, ReactNode } from 'react';

export type PracticeDrawer = 'courses' | 'banks' | null;

interface PracticeMobileBarProps {
  open: PracticeDrawer;
  onOpenChange: (drawer: PracticeDrawer) => void;
  courses: ReactNode;
  banks: ReactNode;
}

const DRAWER_WIDTH = 340;

/** Phones and tablets: "Courses" and "Quiz banks" buttons that open the two lists as drawers. */
export const PracticeMobileBar: FC<PracticeMobileBarProps> = ({
  open,
  onOpenChange,
  courses,
  banks,
}) => {
  const { t } = useTranslation();
  const close = () => {
    onOpenChange(null);
  };
  const paper = { sx: { width: `min(${DRAWER_WIDTH}px, 90vw)` } };
  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Button
          variant="outlined"
          color="warning"
          startIcon={<SchoolOutlinedIcon />}
          onClick={() => {
            onOpenChange('courses');
          }}
          sx={{ minHeight: 44 }}
        >
          {t('quiz.practice.mobile.courses')}
        </Button>
        <Button
          variant="outlined"
          startIcon={<FormatListBulletedIcon />}
          onClick={() => {
            onOpenChange('banks');
          }}
          sx={{ minHeight: 44 }}
        >
          {t('quiz.practice.mobile.banks')}
        </Button>
      </Box>
      <Drawer anchor="left" open={open === 'courses'} onClose={close} slotProps={{ paper }}>
        {courses}
      </Drawer>
      <Drawer anchor="right" open={open === 'banks'} onClose={close} slotProps={{ paper }}>
        {banks}
      </Drawer>
    </>
  );
};
