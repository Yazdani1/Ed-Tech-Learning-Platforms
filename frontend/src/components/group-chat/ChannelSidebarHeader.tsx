'use client';

import GroupsIcon from '@mui/icons-material/Groups';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { HEADER_GRADIENT } from './group-chat-utils';

import type { FC } from 'react';

interface ChannelSidebarHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
}

const searchSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(255,255,255,0.16)',
    color: '#fff',
    borderRadius: 2,
    minHeight: 44,
    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
  },
  '& input::placeholder': { color: 'rgba(255,255,255,0.75)', opacity: 1 },
} as const;

/** Gradient header of the channel column: page title and channel search. */
export const ChannelSidebarHeader: FC<ChannelSidebarHeaderProps> = ({ search, onSearchChange }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ p: 2, background: HEADER_GRADIENT, color: '#fff' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
        <GroupsIcon />
        <Typography component="h1" sx={{ fontWeight: 900 }}>
          {t('groupChat.title')}
        </Typography>
      </Stack>
      <TextField
        fullWidth
        size="small"
        placeholder={t('groupChat.searchChannels')}
        value={search}
        onChange={(event) => {
          onSearchChange(event.target.value);
        }}
        slotProps={{
          htmlInput: { 'aria-label': t('groupChat.searchChannelsLabel') },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.75)' }} />
              </InputAdornment>
            ),
          },
        }}
        sx={searchSx}
      />
    </Box>
  );
};
