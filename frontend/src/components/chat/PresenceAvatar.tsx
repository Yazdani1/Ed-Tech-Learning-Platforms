import Box from '@mui/material/Box';

import { UserAvatar } from '@/components/common/UserAvatar';

import { chatRoleColor, OFFLINE_COLOR, ONLINE_COLOR } from './chat.utils';

import type { FC } from 'react';

interface PresenceAvatarProps {
  name: string;
  avatar: string | null | undefined;
  online: boolean;
}

/** A student's avatar with a green (online) or grey (offline) dot. */
export const PresenceAvatar: FC<PresenceAvatarProps> = ({ name, avatar, online }) => (
  <Box sx={{ position: 'relative' }}>
    <UserAvatar name={name} color={chatRoleColor('Student')} avatar={avatar} size={40} />
    <Box
      sx={{
        position: 'absolute',
        right: 1,
        bottom: 1,
        width: 11,
        height: 11,
        borderRadius: '50%',
        bgcolor: online ? ONLINE_COLOR : OFFLINE_COLOR,
        border: '2px solid #fff',
      }}
    />
  </Box>
);
