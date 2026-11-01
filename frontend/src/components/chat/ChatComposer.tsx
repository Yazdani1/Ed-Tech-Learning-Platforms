import SendIcon from '@mui/icons-material/Send';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { MAX_CHAT_MESSAGE_LENGTH } from '@/schemas/chat.schema';

import { CHAT_ACCENT, CHAT_BORDER, CHAT_SURFACE } from './chat.utils';

import type { ChatComposerState } from './useChatComposer';
import type { FC, KeyboardEvent } from 'react';

interface ChatComposerProps {
  composer: ChatComposerState;
  placeholder: string;
}

const MAX_ROWS = 4;

/** The message box: Enter sends, Shift+Enter starts a new line (at most 2000 characters). */
export const ChatComposer: FC<ChatComposerProps> = ({ composer, placeholder }) => {
  const { t } = useTranslation();
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      composer.send();
    }
  };
  return (
    <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: CHAT_BORDER, bgcolor: '#fff' }}>
      <TextField
        fullWidth
        size="small"
        multiline
        maxRows={MAX_ROWS}
        placeholder={placeholder}
        value={composer.value}
        onChange={(event) => {
          composer.change(event.target.value);
        }}
        onKeyDown={onKeyDown}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: CHAT_SURFACE } }}
        slotProps={{
          htmlInput: {
            maxLength: MAX_CHAT_MESSAGE_LENGTH,
            'aria-label': t('messaging.chat.messageLabel'),
          },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={composer.send}
                  disabled={!composer.canSend}
                  aria-label={t('messaging.chat.send')}
                  sx={{
                    width: 44,
                    height: 44,
                    bgcolor: composer.canSend ? CHAT_ACCENT : 'transparent',
                    color: composer.canSend ? '#fff' : 'text.disabled',
                    '&:hover': { bgcolor: composer.canSend ? '#4f46e5' : 'transparent' },
                  }}
                >
                  <SendIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
};
