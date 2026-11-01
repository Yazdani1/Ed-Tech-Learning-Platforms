'use client';

import { useModal } from '@/hooks/useModal';

import { ChannelConversation } from './ChannelConversation';
import type { DetailsTab } from './ChannelDetailsModal';
import { ChannelDialogs } from './ChannelDialogs';
import { ChannelHeader } from './ChannelHeader';
import { ChannelJoinPreview } from './ChannelJoinPreview';
import {
  canManageChannel,
  hasPendingRequest,
  isFullChannel,
  pendingRequests,
} from './group-chat-utils';
import { useChannelMembership } from './useChannelMembership';
import { useChannelMenu } from './useChannelMenu';

import type { User } from '@/schemas/auth.schema';
import type { ChannelOrCard, TypingEvent } from '@/schemas/group-chat.schema';
import type { FC } from 'react';

interface ChannelPanelProps {
  channel: ChannelOrCard;
  user: User | null;
  /** Member or platform staff: may read and write messages */
  canOpen: boolean;
  typingUser: TypingEvent | null;
  onTyping: (isTyping: boolean) => void;
  /** The channel is gone for me (left or archived) */
  onGone: () => void;
  /** Phones: back to the channel list */
  onBack?: () => void;
}

/** The right side for the selected channel: header, then the conversation or the join card, and dialogs. */
export const ChannelPanel: FC<ChannelPanelProps> = ({
  channel,
  user,
  canOpen,
  typingUser,
  onTyping,
  onGone,
  onBack,
}) => {
  const editModal = useModal();
  const addModal = useModal();
  const detailsModal = useModal<DetailsTab>();
  const canManage = canManageChannel(channel, user?._id, user?.role);
  const menuItems = useChannelMenu({ channel, user, onEdit: editModal.openModal, onGone });
  const membership = useChannelMembership(channel);
  const full = isFullChannel(channel) ? channel : null;

  return (
    <>
      <ChannelHeader
        channel={channel}
        canManage={canManage}
        pendingCount={pendingRequests(channel).length}
        actions={menuItems}
        isBlocked={full?.isBlocked ?? false}
        onOpenDetails={full ? detailsModal.openModal : undefined}
        onAddMembers={addModal.openModal}
        onBack={onBack}
      />
      {canOpen ? (
        <ChannelConversation
          channelId={channel._id}
          userId={user?._id}
          typingUser={typingUser}
          onTyping={onTyping}
        />
      ) : (
        <ChannelJoinPreview
          channel={channel}
          hasPendingRequest={hasPendingRequest(channel, user?._id)}
          busy={membership.joinBusy}
          onJoin={membership.join}
          onCancelRequest={membership.cancelRequest}
        />
      )}
      {full && (
        <ChannelDialogs
          channel={full}
          currentUserId={user?._id}
          canManage={canManage}
          editModal={editModal}
          addModal={addModal}
          detailsModal={detailsModal}
          membership={membership}
        />
      )}
    </>
  );
};
