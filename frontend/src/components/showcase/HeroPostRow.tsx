'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { HeroPostMenu, type HeroPostMenuProps } from './HeroPostMenu';
import { HeroPostThumbnail } from './HeroPostThumbnail';
import { useHeroText } from './useHeroText';

import type { FC, ReactNode } from 'react';

interface HeroPostRowProps extends HeroPostMenuProps {
  /** The drag handle (from the sortable list) */
  dragHandle?: ReactNode;
}

const SCHEDULE_COLOR = '#b45309';

/** One slider image: thumbnail with chips, drag handle, size and schedule, and its menu. */
export const HeroPostRow: FC<HeroPostRowProps> = ({ dragHandle, ...menu }) => {
  const text = useHeroText();
  const { post } = menu;

  return (
    <Paper
      variant="outlined"
      sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, overflow: 'hidden' }}
    >
      <HeroPostThumbnail post={post} position={menu.position} onView={menu.onView} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, flex: 1, minWidth: 0 }}>
        {dragHandle}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {text.dimensions(post, 'showcase.posts.noDimensions')}
          </Typography>
          <Typography variant="body2" sx={{ color: SCHEDULE_COLOR, fontWeight: 800, mt: 0.25 }}>
            {text.schedule(post)}
          </Typography>
        </Box>
        <HeroPostMenu {...menu} />
      </Box>
    </Paper>
  );
};
