'use client';

import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useTranslation } from 'react-i18next';

import { isChannelMember, isFullChannel, isPlatformAdmin } from './group-chat-utils';
import { useChannelCommands } from './useChannelCommands';

import type { ActionMenuItem } from '@/components/common/ActionMenu';
import type { User } from '@/schemas/auth.schema';
import type { ChannelOrCard } from '@/schemas/group-chat.schema';

interface ChannelMenuOptions {
  channel: ChannelOrCard | null;
  user: User | null;
  onEdit: () => void;
  /** The channel is gone for me (left or archived) */
  onGone: () => void;
}

/**
 * The channel's ⋮ menu, shown as the backend allows: Edit and Delete (archive) for the creator and
 * platform staff, Leave for other members, Block / Unblock for Super Admin, Admin and Moderator.
 */
export const useChannelMenu = ({
  channel,
  user,
  onEdit,
  onGone,
}: ChannelMenuOptions): ActionMenuItem[] => {
  const { t } = useTranslation();
  const commands = useChannelCommands(onGone);
  if (!isFullChannel(channel)) return [];

  const staff = isPlatformAdmin(user?.role);
  const creator = channel.creatorId === user?._id;
  return [
    {
      label: t('groupChat.actions.edit'),
      icon: <EditIcon />,
      onClick: onEdit,
      visible: creator || staff,
    },
    {
      label: t('groupChat.actions.leave'),
      icon: <ExitToAppIcon />,
      onClick: () => {
        commands.leave(channel);
      },
      visible: isChannelMember(channel, user?._id) && !creator && !staff,
    },
    {
      label: t('groupChat.actions.delete'),
      icon: <DeleteIcon />,
      danger: true,
      onClick: () => {
        commands.archive(channel);
      },
      visible: creator || staff,
    },
    {
      label: t(channel.isBlocked ? 'groupChat.actions.unblock' : 'groupChat.actions.block'),
      icon: <BlockIcon />,
      onClick: () => {
        commands.toggleBlock(channel);
      },
      visible: staff,
    },
  ];
};
