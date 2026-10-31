'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface LearnTopBarProps {
  title: string;
  /** The lecture playing right now (Video Lectures tab) */
  subtitle?: string;
  backHref: string;
}

/** Back to the course list, the course title and the current lecture. */
export const LearnTopBar: FC<LearnTopBarProps> = ({ title, subtitle, backHref }) => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: { xs: 1, sm: 2 },
        py: 1,
        minHeight: 56,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Tooltip title={t('learn.back')}>
        <IconButton
          component={Link}
          href={backHref}
          aria-label={t('learn.back')}
          sx={{ width: 44, height: 44 }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          component="h1"
          variant="subtitle1"
          noWrap
          sx={{ fontWeight: 700, lineHeight: 1.3 }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
