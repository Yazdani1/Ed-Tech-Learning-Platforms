'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useId } from 'react';

import { CHART_HEIGHT } from './insights.utils';

import type { FC, ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

/** A titled, outlined panel holding one chart (fixed plot height); the title names the figure. */
export const ChartCard: FC<ChartCardProps> = ({ title, children }) => {
  const titleId = useId();
  return (
    <Paper
      component="figure"
      variant="outlined"
      aria-labelledby={titleId}
      sx={{ p: 2.5, m: 0, minWidth: 0 }}
    >
      <Typography id={titleId} component="figcaption" variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
        {title}
      </Typography>
      <Box sx={{ height: CHART_HEIGHT }}>{children}</Box>
    </Paper>
  );
};
