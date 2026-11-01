import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { SearchField } from '@/components/common/SearchField';

import { CHAT_BORDER, CHAT_SURFACE } from './chat.utils';

import type { FC } from 'react';

interface MessageSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/** "Search messages..." bar above a conversation. */
export const MessageSearchField: FC<MessageSearchFieldProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ px: 2, py: 1.25, bgcolor: '#fff', borderBottom: 1, borderColor: CHAT_BORDER }}>
      <SearchField
        value={value}
        onChange={onChange}
        label={t('messaging.chat.searchMessages')}
        placeholder={t('messaging.chat.searchMessages')}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: CHAT_SURFACE } }}
      />
    </Box>
  );
};
