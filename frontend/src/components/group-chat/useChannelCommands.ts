'use client';

import { useTranslation } from 'react-i18next';

import { useArchiveChannel, useLeaveChannel, useToggleBlockChannel } from '@/api/group-chat.api';
import { useConfirm } from '@/hooks/useConfirm';
import { useToastResult } from '@/hooks/useToastResult';

import type { Channel } from '@/schemas/group-chat.schema';

export interface ChannelCommands {
  leave: (channel: Channel) => void;
  archive: (channel: Channel) => void;
  toggleBlock: (channel: Channel) => void;
}

type ConfirmedKind = 'leave' | 'delete';

/** Leave / delete (archive, after a confirmation) and block / unblock a channel, with toasts. */
export const useChannelCommands = (onGone: () => void): ChannelCommands => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const toastResult = useToastResult();
  const leaveMutation = useLeaveChannel();
  const archiveMutation = useArchiveChannel();
  const blockMutation = useToggleBlockChannel();

  const run = async (kind: ConfirmedKind, channel: Channel): Promise<void> => {
    const confirmed = await confirm({
      title: t(`groupChat.confirm.${kind}Title`),
      message: t(`groupChat.confirm.${kind}Message`, { name: channel.name }),
      confirmLabel: t(`groupChat.confirm.${kind}`),
      destructive: true,
    });
    if (!confirmed) return;
    const leaving = kind === 'leave';
    const work = leaving
      ? leaveMutation.mutateAsync(channel._id)
      : archiveMutation.mutateAsync(channel._id);
    const done = await toastResult(
      work,
      t(leaving ? 'groupChat.toast.left' : 'groupChat.toast.archived'),
    );
    if (done) onGone();
  };

  return {
    leave: (channel) => {
      void run('leave', channel);
    },
    archive: (channel) => {
      void run('delete', channel);
    },
    toggleBlock: (channel) => {
      void toastResult(
        blockMutation.mutateAsync(channel._id),
        t(channel.isBlocked ? 'groupChat.toast.unblocked' : 'groupChat.toast.blocked'),
      );
    },
  };
};
