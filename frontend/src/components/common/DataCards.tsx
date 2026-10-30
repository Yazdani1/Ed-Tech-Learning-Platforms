'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { rowActivationProps } from './row-activation';

import type { DataViewBodyProps } from './data-view.types';
import type { ReactElement, ReactNode } from 'react';

interface DataCardsProps<T> extends DataViewBodyProps<T> {
  renderCard?: (row: T) => ReactNode;
}

/** Phone body of ResponsiveDataView: one card per row. (Generic, so it is a function rather than an FC.) */
export const DataCards = <T,>({
  rows,
  columns,
  getRowId,
  label,
  onRowClick,
  renderCard,
}: DataCardsProps<T>): ReactElement => (
  <Stack component="ul" aria-label={label} spacing={1.5} sx={{ listStyle: 'none', p: 0, m: 0 }}>
    {rows.map((row) => (
      <Card
        component="li"
        key={getRowId(row)}
        variant="outlined"
        sx={{ cursor: onRowClick ? 'pointer' : undefined }}
      >
        <CardContent
          role={onRowClick ? 'button' : undefined}
          {...rowActivationProps(
            onRowClick &&
              (() => {
                onRowClick(row);
              }),
          )}
          sx={{ '&:last-child': { pb: 2 } }}
        >
          {renderCard
            ? renderCard(row)
            : columns
                .filter((column) => !column.hideOnMobile)
                .map((column) => (
                  <Box
                    key={column.key}
                    sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.5 }}
                  >
                    {column.header && (
                      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                        {column.header}
                      </Typography>
                    )}
                    <Box sx={{ minWidth: 0, textAlign: 'right', ml: 'auto' }}>
                      {column.render(row)}
                    </Box>
                  </Box>
                ))}
        </CardContent>
      </Card>
    ))}
  </Stack>
);
