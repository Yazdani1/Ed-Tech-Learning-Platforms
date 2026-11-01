'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/hooks/useAuth';
import { useGroupChatSocket } from '@/hooks/useGroupChatSocket';
import { useModal } from '@/hooks/useModal';

import { ChannelFormModal } from './ChannelFormModal';
import { ChannelPanel } from './ChannelPanel';
import { ChannelSidebar } from './ChannelSidebar';
import { useGroupChatSelection } from './useGroupChatSelection';

const SIDEBAR_WIDTH = 320;

/** Fills the screen under the shell's top bar (phones/tablets) and inside the page padding. */
const pageSx = {
  display: 'flex',
  height: { xs: 'calc(100dvh - 88px)', sm: 'calc(100dvh - 112px)', md: 'calc(100dvh - 48px)' },
  minHeight: 420,
  overflow: 'hidden',
} as const;
const sidebarSx = {
  width: { xs: '100%', md: SIDEBAR_WIDTH },
  flexShrink: 0,
  borderRight: { md: '1px solid' },
  borderColor: { md: 'divider' },
} as const;
const panelSx = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  bgcolor: '#f5f7fb',
} as const;

/**
 * /admin/group-chat and /student/group-chat: channel list on the left, the selected channel on the right.
 * Phones show one side at a time (the list, or the channel with a back button).
 */
export const GroupChatPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const phone = useMediaQuery(useTheme().breakpoints.down('md'));
  const createModal = useModal();
  const view = useGroupChatSelection(user, phone);
  const { selected } = view;
  const live = useGroupChatSocket({
    channelId: selected?._id ?? null,
    canOpen: view.canOpen,
    user,
  });
  const clearSelection = (): void => {
    view.select(null);
  };

  return (
    <Paper variant="outlined" sx={pageSx}>
      {(!phone || !selected) && (
        <Box sx={sidebarSx}>
          <ChannelSidebar view={view} userId={user?._id} onCreate={createModal.openModal} />
        </Box>
      )}
      {(!phone || selected) && (
        <Box component="section" sx={panelSx}>
          {selected ? (
            <ChannelPanel
              key={selected._id}
              channel={selected}
              user={user}
              canOpen={view.canOpen}
              typingUser={live.typingUser}
              onTyping={live.emitTyping}
              onGone={clearSelection}
              onBack={phone ? clearSelection : undefined}
            />
          ) : (
            <Typography color="text.secondary" sx={{ m: 'auto', p: 3, textAlign: 'center' }}>
              {t('groupChat.selectPrompt')}
            </Typography>
          )}
        </Box>
      )}
      <ChannelFormModal
        open={createModal.open}
        channel={undefined}
        onClose={createModal.closeModal}
        onSaved={(channel) => {
          view.select(channel._id);
        }}
      />
    </Paper>
  );
};
