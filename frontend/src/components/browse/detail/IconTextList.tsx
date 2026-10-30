import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

export interface IconTextItem {
  icon: ReactNode;
  text: string;
}

interface IconTextListProps {
  items: readonly IconTextItem[];
  /** Smaller grey caption text (enrolment card) instead of body text */
  dense?: boolean;
}

/** A list of icon + text lines ("Full lifetime access", "Certificate of completion", ...). */
export const IconTextList: FC<IconTextListProps> = ({ items, dense = false }) => (
  <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
    {items.map(({ icon, text }) => (
      <Box
        component="li"
        key={text}
        sx={{ display: 'flex', gap: dense ? 1 : 1.5, alignItems: 'center', mb: dense ? 0.75 : 1 }}
      >
        <Box sx={{ color: 'text.secondary', display: 'flex' }} aria-hidden>
          {icon}
        </Box>
        <Typography
          variant={dense ? 'caption' : 'body2'}
          color={dense ? 'text.secondary' : 'text.primary'}
        >
          {text}
        </Typography>
      </Box>
    ))}
  </Box>
);
