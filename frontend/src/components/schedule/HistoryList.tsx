'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { Fragment } from 'react';

import { HistoryItem } from './HistoryItem';

import type { Schedule } from '@/schemas/schedule.schema';
import type { FC } from 'react';

interface HistoryListProps {
  items: Schedule[];
  emptyText: string;
}

/** The completed items of one type, one per row (a message when there are none of this type). */
export const HistoryList: FC<HistoryListProps> = ({ items, emptyText }) => (
  <Card variant="outlined">
    {items.length === 0 ? (
      <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
        {emptyText}
      </Typography>
    ) : (
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {items.map((item, index) => (
          <Fragment key={item._id}>
            {index > 0 && <Divider component="li" aria-hidden />}
            <HistoryItem item={item} />
          </Fragment>
        ))}
      </Box>
    )}
  </Card>
);
