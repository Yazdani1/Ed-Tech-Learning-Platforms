'use client';

import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { UserAvatar } from '@/components/common/UserAvatar';

import type { ChannelJoinRequest } from '@/schemas/group-chat.schema';
import type { FC } from 'react';

interface ChannelRequestsTabProps {
  requests: ChannelJoinRequest[];
  busy: boolean;
  onApprove: (userId: string) => void;
}

/** Pending join requests of a private channel, each with Accept. */
export const ChannelRequestsTab: FC<ChannelRequestsTabProps> = ({ requests, busy, onApprove }) => {
  const { t } = useTranslation();
  if (requests.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        {t('groupChat.details.noRequests')}
      </Typography>
    );
  }
  return (
    <List sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      {requests.map((request) => (
        <ListItem
          key={request.user._id}
          divider
          sx={{ pr: 14 }}
          secondaryAction={
            <Button
              variant="contained"
              size="small"
              disabled={busy}
              onClick={() => {
                onApprove(request.user._id);
              }}
              sx={{ minHeight: 44 }}
            >
              {t('groupChat.details.accept')}
            </Button>
          }
        >
          <ListItemAvatar>
            <UserAvatar name={request.user.name} avatar={request.user.avatar} />
          </ListItemAvatar>
          <ListItemText
            primary={request.user.name}
            secondary={t(`roles.${request.user.role}`, { defaultValue: request.user.role })}
            slotProps={{ primary: { noWrap: true } }}
          />
        </ListItem>
      ))}
    </List>
  );
};
