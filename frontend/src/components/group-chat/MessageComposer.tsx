'use client';

import SendIcon from '@mui/icons-material/Send';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { AttachMenu } from './AttachMenu';
import { SelectedFilePreview } from './SelectedFilePreview';
import { useMessageComposer } from './useMessageComposer';

import type { FC } from 'react';

interface MessageComposerProps {
  channelId: string;
  onTyping: (isTyping: boolean) => void;
}

const MAX_INPUT_ROWS = 4;
const barSx = {
  p: { xs: 1, sm: 2 },
  bgcolor: 'background.paper',
  borderTop: '1px solid',
  borderColor: 'divider',
} as const;

/** Message box with file attachments; Enter sends, Shift+Enter adds a line. */
export const MessageComposer: FC<MessageComposerProps> = ({ channelId, onTyping }) => {
  const { t } = useTranslation();
  const composer = useMessageComposer(channelId, onTyping);
  const { files } = composer;

  return (
    <Box sx={barSx}>
      {files.items.length > 0 && (
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mb: 1 }}>
          {files.items.map((item) => (
            <SelectedFilePreview key={item.id} item={item} onRemove={files.remove} />
          ))}
        </Stack>
      )}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end' }}>
        <AttachMenu disabled={composer.sending} onPick={files.add} />
        <TextField
          fullWidth
          multiline
          maxRows={MAX_INPUT_ROWS}
          size="small"
          placeholder={t('groupChat.messages.placeholder')}
          value={composer.text}
          onChange={(event) => {
            composer.changeText(event.target.value);
          }}
          onKeyDown={composer.onKeyDown}
          slotProps={{ htmlInput: { 'aria-label': t('groupChat.messages.inputLabel') } }}
          sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
        />
        <IconButton
          color="primary"
          aria-label={t('groupChat.messages.send')}
          disabled={!composer.canSend}
          onClick={composer.submit}
          sx={{ width: 44, height: 44 }}
        >
          <SendIcon />
        </IconButton>
      </Stack>
    </Box>
  );
};
