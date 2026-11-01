import SearchIcon from '@mui/icons-material/Search';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CHAT_GRADIENT } from './chat.utils';

import type { FC } from 'react';

interface ChatInboxHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
}

const WHITE_FIELD = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    color: '#fff',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.6)' },
    '&.Mui-focused fieldset': { borderColor: '#fff' },
  },
  '& input::placeholder': { color: 'rgba(255,255,255,0.8)', opacity: 1 },
} as const;

/** "Support Inbox" heading with the student search (staff chat). */
export const ChatInboxHeader: FC<ChatInboxHeaderProps> = ({ search, onSearchChange }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ px: 2, py: 2, background: CHAT_GRADIENT, color: '#fff' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <SupportAgentIcon sx={{ fontSize: 20 }} />
        <Typography component="h1" sx={{ fontWeight: 700, fontSize: 15 }}>
          {t('messaging.chat.inbox')}
        </Typography>
      </Box>
      <TextField
        size="small"
        fullWidth
        type="search"
        placeholder={t('messaging.chat.searchStudents')}
        value={search}
        onChange={(event) => {
          onSearchChange(event.target.value);
        }}
        sx={WHITE_FIELD}
        slotProps={{
          htmlInput: { 'aria-label': t('messaging.chat.searchStudents') },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 18 }} />
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
};
