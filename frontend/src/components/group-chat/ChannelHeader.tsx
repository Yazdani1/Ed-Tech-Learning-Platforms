'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';

import { ActionMenu, type ActionMenuItem } from '@/components/common/ActionMenu';

import { ChannelTitleButton } from './ChannelTitleButton';
import { HEADER_GRADIENT } from './group-chat-utils';

import type { DetailsTab } from './ChannelDetailsModal';
import type { ChannelOrCard } from '@/schemas/group-chat.schema';
import type { FC } from 'react';

interface ChannelHeaderProps {
  channel: ChannelOrCard;
  canManage: boolean;
  pendingCount: number;
  actions: ActionMenuItem[];
  isBlocked: boolean;
  /** Undefined for a public card (no details to show) */
  onOpenDetails?: (tab: DetailsTab) => void;
  onAddMembers: () => void;
  /** Phones: back to the channel list */
  onBack?: () => void;
}

const chipSx = { bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 800 } as const;
const whiteButtonSx = {
  minHeight: 44,
  color: 'primary.main',
  fontWeight: 900,
  textTransform: 'none',
} as const;

const backSx = { color: '#fff', width: 44, height: 44 } as const;
const requestsSx = { minHeight: 44, fontWeight: 900, textTransform: 'none' } as const;
const headerSx = {
  px: { xs: 1, sm: 3 },
  py: 1.25,
  background: HEADER_GRADIENT,
  color: '#fff',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 1,
} as const;

/** Gradient bar above the conversation: name (opens details), type, manage buttons and the ⋮ menu. */
export const ChannelHeader: FC<ChannelHeaderProps> = ({
  channel,
  canManage,
  pendingCount,
  actions,
  isBlocked,
  onOpenDetails,
  onAddMembers,
  onBack,
}) => {
  const { t } = useTranslation();
  return (
    <Box sx={headerSx}>
      {onBack && (
        <IconButton aria-label={t('groupChat.backToChannels')} onClick={onBack} sx={backSx}>
          <ArrowBackIcon />
        </IconButton>
      )}
      <ChannelTitleButton channel={channel} onOpen={onOpenDetails} />
      <Chip size="small" label={t(`groupChat.type.${channel.type}`)} sx={chipSx} />
      {isBlocked && <Chip size="small" label={t('groupChat.blocked')} color="warning" />}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
        {canManage && (
          <Button
            variant="contained"
            color="inherit"
            size="small"
            startIcon={<GroupAddIcon />}
            onClick={() => {
              onAddMembers();
            }}
            sx={whiteButtonSx}
          >
            {t('groupChat.addMembers')}
          </Button>
        )}
        {canManage && pendingCount > 0 && (
          <Button
            variant="contained"
            color="warning"
            size="small"
            onClick={() => {
              onOpenDetails?.('requests');
            }}
            sx={requestsSx}
          >
            {t('groupChat.requestsCount', { count: pendingCount })}
          </Button>
        )}
        <Box sx={{ '& .MuiIconButton-root': { color: '#fff' } }}>
          <ActionMenu items={actions} label={t('groupChat.channelActions')} />
        </Box>
      </Box>
    </Box>
  );
};
