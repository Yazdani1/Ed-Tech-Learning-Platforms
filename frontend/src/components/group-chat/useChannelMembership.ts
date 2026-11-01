'use client';

import { useTranslation } from 'react-i18next';

import {
  useApproveJoinRequest,
  useCancelJoinRequest,
  useJoinChannel,
  useRemoveMember,
} from '@/api/group-chat.api';
import { useConfirm } from '@/hooks/useConfirm';
import { useToastResult } from '@/hooks/useToastResult';

import type { ChannelMember, ChannelOrCard } from '@/schemas/group-chat.schema';

export interface ChannelMembership {
  join: () => void;
  cancelRequest: () => void;
  approve: (userId: string) => void;
  removeMember: (member: ChannelMember) => void;
  joinBusy: boolean;
  approveBusy: boolean;
}

/** Join / cancel request (non-members) and approve / remove (channel managers), with toasts. */
export const useChannelMembership = (channel: ChannelOrCard | null): ChannelMembership => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const toastResult = useToastResult();
  const joinMutation = useJoinChannel();
  const cancelMutation = useCancelJoinRequest();
  const approveMutation = useApproveJoinRequest();
  const removeMutation = useRemoveMember();
  const channelId = channel?._id ?? '';

  const removeMember = async (member: ChannelMember): Promise<void> => {
    const confirmed = await confirm({
      title: t('groupChat.confirm.removeTitle'),
      message: t('groupChat.confirm.removeMessage', { name: member.user.name }),
      confirmLabel: t('groupChat.confirm.remove'),
      destructive: true,
    });
    if (!confirmed) return;
    await toastResult(
      removeMutation.mutateAsync({ channelId, userId: member.user._id }),
      t('groupChat.toast.memberRemoved'),
    );
  };

  return {
    join: () => {
      const done =
        channel?.type === 'Private' ? 'groupChat.toast.requestSent' : 'groupChat.toast.joined';
      void toastResult(joinMutation.mutateAsync(channelId), t(done));
    },
    cancelRequest: () => {
      void toastResult(
        cancelMutation.mutateAsync(channelId),
        t('groupChat.toast.requestCancelled'),
      );
    },
    approve: (userId) => {
      void toastResult(
        approveMutation.mutateAsync({ channelId, userId }),
        t('groupChat.toast.approved'),
      );
    },
    removeMember: (member) => {
      void removeMember(member);
    },
    joinBusy: joinMutation.isPending || cancelMutation.isPending,
    approveBusy: approveMutation.isPending,
  };
};
