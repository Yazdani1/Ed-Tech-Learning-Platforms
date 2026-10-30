'use client';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { rowActivationProps } from './row-activation';

import type { DataViewBodyProps } from './data-view.types';
import type { ReactElement } from 'react';

/** Desktop body of ResponsiveDataView. (Generic, so it is a function rather than an FC.) */
export const DataTable = <T,>({
  rows,
  columns,
  getRowId,
  label,
  onRowClick,
}: DataViewBodyProps<T>): ReactElement => (
  <TableContainer component={Card} variant="outlined">
    <Table aria-label={label} size="small">
      <TableHead>
        <TableRow>
          {columns.map((column) => (
            <TableCell
              key={column.key}
              align={column.align}
              sx={{ fontWeight: 700, width: column.width }}
            >
              {column.header}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={getRowId(row)}
            hover
            {...rowActivationProps(
              onRowClick &&
                (() => {
                  onRowClick(row);
                }),
            )}
            sx={{ cursor: onRowClick ? 'pointer' : undefined, '& td': { py: 1 } }}
          >
            {columns.map((column) => (
              <TableCell key={column.key} align={column.align}>
                {column.render(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
