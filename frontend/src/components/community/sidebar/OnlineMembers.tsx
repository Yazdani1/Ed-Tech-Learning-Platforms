'use client';

import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { MemberButton } from './MemberButton';
import { SidebarEmpty } from './SidebarEmpty';

import type { HubWidgets } from '@/schemas/community.schema';
import type { FC } from 'react';

const ONLINE_COLUMNS = 5;
const dotSx = {
  '& .MuiBadge-badge': {
    bgcolor: 'success.main',
    border: 2,
    borderColor: 'background.paper',
    width: 12,
    height: 12,
    borderRadius: '50%',
  },
};

interface OnlineMembersProps {
  members: HubWidgets['onlineMembers'];
}

/** Avatars (with a green dot) of members online now; each opens their profile preview. */
export const OnlineMembers: FC<OnlineMembersProps> = ({ members }) => {
  const { t } = useTranslation();
  if (members.length === 0) return <SidebarEmpty text={t('community.sidebar.noOnline')} />;
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${ONLINE_COLUMNS}, minmax(0, 1fr))`,
        gap: 1,
      }}
    >
      {members.map((item) => (
        <MemberButton
          key={item.user._id}
          member={item.user}
          label={item.user.name}
          decorate={(avatar) => (
            <Badge
              overlap="circular"
              variant="dot"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              sx={dotSx}
            >
              {avatar}
            </Badge>
          )}
        />
      ))}
    </Box>
  );
};
