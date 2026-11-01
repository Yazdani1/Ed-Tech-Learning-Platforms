'use client';

import { AddMembersModal } from './AddMembersModal';
import { ChannelDetailsModal, type DetailsTab } from './ChannelDetailsModal';
import { ChannelFormModal } from './ChannelFormModal';

import type { ModalState } from '@/hooks/useModal';
import type { Channel } from '@/schemas/group-chat.schema';
import type { ChannelMembership } from './useChannelMembership';
import type { FC } from 'react';

interface ChannelDialogsProps {
  channel: Channel;
  currentUserId: string | undefined;
  canManage: boolean;
  editModal: ModalState<undefined>;
  addModal: ModalState<undefined>;
  detailsModal: ModalState<DetailsTab>;
  membership: ChannelMembership;
}

const ignoreSaved = (): void => undefined;

/** The dialogs of the selected channel: edit, add members and details (members, requests). */
export const ChannelDialogs: FC<ChannelDialogsProps> = ({
  channel,
  currentUserId,
  canManage,
  editModal,
  addModal,
  detailsModal,
  membership,
}) => (
  <>
    <ChannelFormModal
      open={editModal.open}
      channel={channel}
      onClose={editModal.closeModal}
      onSaved={ignoreSaved}
    />
    {addModal.open && <AddMembersModal channel={channel} onClose={addModal.closeModal} />}
    {detailsModal.open && (
      <ChannelDetailsModal
        channel={channel}
        currentUserId={currentUserId}
        canManage={canManage}
        initialTab={detailsModal.data ?? 'description'}
        approving={membership.approveBusy}
        onClose={detailsModal.closeModal}
        onApprove={membership.approve}
        onRemove={membership.removeMember}
      />
    )}
  </>
);
