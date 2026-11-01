'use client';

import CloseIcon from '@mui/icons-material/Close';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import { UserAvatar } from '@/components/common/UserAvatar';

import type { ChannelMember } from '@/schemas/group-chat.schema';
import type { FC } from 'react';

interface ChannelMembersTabProps {
  members: ChannelMember[];
  currentUserId: string | undefined;
  canManage: boolean;
  onRemove: (member: ChannelMember) => void;
}

/** Members with their channel role; managers can remove ordinary members (not admins, not themselves). */
export const ChannelMembersTab: FC<ChannelMembersTabProps> = ({
  members,
  currentUserId,
  canManage,
  onRemove,
}) => {
  const { t } = useTranslation();
  return (
    <List sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      {members.map((member) => {
        const removable = canManage && member.role !== 'Admin' && member.user._id !== currentUserId;
        return (
          <ListItem
            key={member.user._id}
            divider
            secondaryAction={
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <Chip
                  label={t(`groupChat.details.memberRole.${member.role}`)}
                  size="small"
                  variant="outlined"
                />
                {removable && (
                  <IconButton
                    color="error"
                    aria-label={t('groupChat.details.remove', { name: member.user.name })}
                    onClick={() => {
                      onRemove(member);
                    }}
                    sx={{ width: 44, height: 44 }}
                  >
                    <CloseIcon />
                  </IconButton>
                )}
              </Stack>
            }
            sx={{ pr: removable ? 18 : 12 }}
          >
            <ListItemAvatar>
              <UserAvatar name={member.user.name} avatar={member.user.avatar} />
            </ListItemAvatar>
            <ListItemText
              primary={member.user.name}
              secondary={t(`roles.${member.user.role}`, { defaultValue: member.user.role })}
              slotProps={{ primary: { noWrap: true } }}
            />
          </ListItem>
        );
      })}
    </List>
  );
};
