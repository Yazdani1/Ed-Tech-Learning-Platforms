'use client';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';

import { ChannelMembersTab } from './ChannelMembersTab';
import { ChannelRequestsTab } from './ChannelRequestsTab';
import { pendingRequests } from './group-chat-utils';

import type { Channel, ChannelMember } from '@/schemas/group-chat.schema';
import type { FC } from 'react';

export type DetailsTab = 'description' | 'members' | 'requests';

interface ChannelDetailsModalProps {
  channel: Channel;
  currentUserId: string | undefined;
  canManage: boolean;
  initialTab: DetailsTab;
  approving: boolean;
  onClose: () => void;
  onApprove: (userId: string) => void;
  onRemove: (member: ChannelMember) => void;
}

const descriptionSx = {
  p: 1.5,
  borderRadius: 1,
  bgcolor: 'grey.50',
  border: '1px solid',
  borderColor: 'divider',
} as const;
const tabsSx = { borderBottom: '1px solid', borderColor: 'divider', mb: 2 } as const;

/** Channel details: description, members (remove) and, for managers, pending join requests (accept). */
export const ChannelDetailsModal: FC<ChannelDetailsModalProps> = ({
  channel,
  currentUserId,
  canManage,
  initialTab,
  approving,
  onClose,
  onApprove,
  onRemove,
}) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<DetailsTab>(initialTab);
  const requests = pendingRequests(channel);
  const activeTab = tab === 'requests' && !canManage ? 'description' : tab;

  return (
    <AppModal open title={channel.name} onClose={onClose} cancelLabel={t('common.close')}>
      <Tabs
        value={activeTab}
        onChange={(_event, value: DetailsTab) => {
          setTab(value);
        }}
        variant="scrollable"
        sx={tabsSx}
      >
        <Tab value="description" label={t('groupChat.details.description')} />
        <Tab
          value="members"
          label={t('groupChat.details.members', { count: channel.members.length })}
        />
        {canManage && (
          <Tab
            value="requests"
            label={t('groupChat.details.requests', { count: requests.length })}
          />
        )}
      </Tabs>
      {activeTab === 'description' && (
        <Box sx={descriptionSx}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {channel.description.trim() || t('groupChat.details.noDescription')}
          </Typography>
        </Box>
      )}
      {activeTab === 'members' && (
        <ChannelMembersTab
          members={channel.members}
          currentUserId={currentUserId}
          canManage={canManage}
          onRemove={onRemove}
        />
      )}
      {activeTab === 'requests' && (
        <ChannelRequestsTab requests={requests} busy={approving} onApprove={onApprove} />
      )}
    </AppModal>
  );
};
