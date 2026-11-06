'use client';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { useTranslation } from 'react-i18next';

import type { UsePaginationItem } from '@mui/material/usePagination';
import type { FC } from 'react';

interface PaginationItemProps {
  item: UsePaginationItem;
}

const ITEM_SIZE = 44;
const ITEM_SX = {
  minWidth: ITEM_SIZE,
  height: ITEM_SIZE,
  px: 1,
  borderRadius: '12px',
  fontWeight: 700,
  fontSize: '0.95rem',
  color: 'text.primary',
  transition: 'background-color 0.15s ease, color 0.15s ease',
  '&:hover': { bgcolor: 'action.hover' },
  '&.Mui-disabled': { color: 'text.disabled' },
  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
} as const;
const SELECTED_SX = {
  ...ITEM_SX,
  bgcolor: 'primary.main',
  color: 'common.white',
  boxShadow: '0 4px 12px rgba(37,99,235,0.30)',
  '&:hover': { bgcolor: 'primary.dark' },
} as const;

/** One entry of the pagination: previous / next arrow, a page number (the current one filled) or a gap. */
export const PaginationItem: FC<PaginationItemProps> = ({ item }) => {
  const { t } = useTranslation();
  const { page, type, selected, ...rest } = item;
  if (type === 'start-ellipsis' || type === 'end-ellipsis') {
    return (
      <Box component="li" aria-hidden sx={{ px: 0.5 }}>
        …
      </Box>
    );
  }
  const label = type === 'page' ? t('common.goToPage', { page }) : t(`common.pagination.${type}`);
  return (
    <Box component="li">
      <ButtonBase
        {...rest}
        aria-label={label}
        aria-current={selected ? 'page' : undefined}
        sx={selected ? SELECTED_SX : ITEM_SX}
      >
        {type === 'previous' && <ChevronLeftIcon />}
        {type === 'next' && <ChevronRightIcon />}
        {type === 'page' && page}
      </ButtonBase>
    </Box>
  );
};
