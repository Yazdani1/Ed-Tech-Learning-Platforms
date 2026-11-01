'use client';

import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { UserAvatar } from '@/components/common/UserAvatar';

import type { SearchUser } from '@/schemas/group-chat.schema';
import type { FC } from 'react';

interface UserSearchListProps {
  users: SearchUser[];
  memberIds: Set<string>;
  selectedIds: string[];
  /** Shows "No users found." (the search ran and found nobody) */
  showEmpty: boolean;
  onToggle: (userId: string) => void;
}

const listSx = {
  maxHeight: 360,
  overflowY: 'auto',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
} as const;

/** Search results of the Add Members dialog: tap to select; members are shown but disabled. */
export const UserSearchList: FC<UserSearchListProps> = ({
  users,
  memberIds,
  selectedIds,
  showEmpty,
  onToggle,
}) => {
  const { t } = useTranslation();
  const describe = (user: SearchUser): string => {
    if (memberIds.has(user._id)) return t('groupChat.addMembersModal.alreadyMember');
    const role = t(`roles.${user.role}`, { defaultValue: user.role });
    return user.email ? `${role} - ${user.email}` : role;
  };

  return (
    <List aria-label={t('groupChat.addMembersModal.results')} sx={listSx}>
      {users.map((user) => (
        <ListItemButton
          key={user._id}
          disabled={memberIds.has(user._id)}
          selected={selectedIds.includes(user._id)}
          aria-pressed={selectedIds.includes(user._id)}
          onClick={() => {
            onToggle(user._id);
          }}
          sx={{ minHeight: 56 }}
        >
          <ListItemAvatar>
            <UserAvatar name={user.name} avatar={user.avatar} />
          </ListItemAvatar>
          <ListItemText primary={user.name} secondary={describe(user)} />
        </ListItemButton>
      ))}
      {showEmpty && (
        <Typography sx={{ p: 2 }} color="text.secondary">
          {t('groupChat.addMembersModal.noUsers')}
        </Typography>
      )}
    </List>
  );
};
