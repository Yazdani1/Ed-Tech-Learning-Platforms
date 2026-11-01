'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';

import type { FC } from 'react';

export interface ProfileLinkItem {
  id: string;
  title: string;
  /** The discussion's page, or null when it cannot be opened */
  href: string | null;
  subtitle: string;
}

interface ProfileLinkListProps {
  title: string;
  items: ProfileLinkItem[];
  emptyText: string;
}

/** A titled list of discussions or answers on a profile, each opening its discussion. */
export const ProfileLinkList: FC<ProfileLinkListProps> = ({ title, items, emptyText }) => (
  <Paper
    component="section"
    aria-label={title}
    elevation={0}
    sx={{ p: 2, border: 1, borderColor: 'divider' }}
  >
    <Typography variant="h6" component="h2" sx={{ fontWeight: 900, mb: 1 }}>
      {title}
    </Typography>
    {items.length === 0 ? (
      <Typography color="text.secondary">{emptyText}</Typography>
    ) : (
      <Stack
        component="ul"
        divider={<Divider component="li" aria-hidden />}
        sx={{ m: 0, p: 0, listStyle: 'none' }}
      >
        {items.map((item) => (
          <Box component="li" key={item.id} sx={{ py: 1.35 }}>
            {item.href ? (
              <Link
                component={NextLink}
                href={item.href}
                underline="hover"
                color="inherit"
                sx={{ fontWeight: 800 }}
              >
                {item.title}
              </Link>
            ) : (
              <Typography sx={{ fontWeight: 800 }}>{item.title}</Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
              {item.subtitle}
            </Typography>
          </Box>
        ))}
      </Stack>
    )}
  </Paper>
);
