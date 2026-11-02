'use client';

import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Switch from '@mui/material/Switch';
import { useTranslation } from 'react-i18next';

import type { PublicLink } from '@/components/public/common/public-links';
import type { FC } from 'react';

interface SitePageRowProps {
  link: PublicLink;
  active: boolean;
  /** A change is being saved: every switch waits */
  disabled: boolean;
  divider: boolean;
  onToggle: (active: boolean) => void;
}

/** One public page: its name and address, and the Active switch. */
export const SitePageRow: FC<SitePageRowProps> = ({
  link,
  active,
  disabled,
  divider,
  onToggle,
}) => {
  const { t } = useTranslation();
  const label = t(link.labelKey);
  return (
    <ListItem
      divider={divider}
      sx={{ py: 1.5, gap: 2 }}
      secondaryAction={
        <Switch
          edge="end"
          checked={active}
          disabled={disabled}
          onChange={(event) => {
            onToggle(event.target.checked);
          }}
          slotProps={{ input: { 'aria-label': t('showcase.pages.toggle', { page: label }) } }}
        />
      }
    >
      <ListItemText
        primary={label}
        secondary={`${link.href} · ${t(active ? 'showcase.pages.active' : 'showcase.pages.inactive')}`}
        slotProps={{ primary: { sx: { fontWeight: 700 } } }}
      />
    </ListItem>
  );
};
