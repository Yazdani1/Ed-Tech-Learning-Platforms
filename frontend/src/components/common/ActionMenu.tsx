'use client';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { FC, MouseEvent, ReactNode } from 'react';

export interface ActionMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  /** Red text (delete, archive) */
  danger?: boolean;
  disabled?: boolean;
  /** Hidden when false (e.g. role checks) */
  visible?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  /** Accessible name of the "⋮" button, e.g. "Actions for Physics 101" */
  label?: string;
}

/** The "⋮" row menu used by every list (table rows and mobile cards). */
export const ActionMenu: FC<ActionMenuProps> = ({ items, label }) => {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const visible = items.filter((item) => item.visible !== false);
  if (visible.length === 0) return null;

  const open = (event: MouseEvent<HTMLElement>): void => {
    event.stopPropagation();
    setAnchor(event.currentTarget);
  };

  return (
    <>
      <IconButton
        aria-label={label ?? t('common.actions')}
        aria-haspopup="menu"
        onClick={open}
        sx={{ width: 44, height: 44 }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => {
          setAnchor(null);
        }}
        onClick={(event) => {
          event.stopPropagation();
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {visible.map((item) => (
          <MenuItem
            key={item.label}
            disabled={item.disabled}
            onClick={() => {
              setAnchor(null);
              item.onClick();
            }}
            sx={{ minHeight: 44, color: item.danger ? 'error.main' : undefined }}
          >
            {item.icon && <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>}
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
