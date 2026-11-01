'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EXPANDED_BACKGROUND, PRIORITY_STYLES, UNREAD_BACKGROUND } from './notification-styles';
import { NotificationDetails } from './NotificationDetails';
import { NotificationSummary } from './NotificationSummary';

import type { Notification } from '@/schemas/notifications.schema';
import type { FC, ReactNode } from 'react';

interface NotificationCardProps {
  notification: Notification;
  /** Highlighted with an "Unread" chip (inbox only) */
  unread?: boolean;
  /** Extra chips after the priority (e.g. the target roles in the sent list) */
  chips?: ReactNode;
  /** The "⋮" menu (sent list) */
  menu?: ReactNode;
  /** Called when the card is opened (the inbox marks it read) */
  onOpen?: () => void;
}

const backgroundOf = (expanded: boolean, unread: boolean): string => {
  if (expanded) return EXPANDED_BACKGROUND;
  return unread ? UNREAD_BACKGROUND : 'background.paper';
};

const SUMMARY_SX = {
  flex: 1,
  minWidth: 0,
  minHeight: 48,
  px: 2.25,
  py: 1.5,
  justifyContent: 'flex-start',
  textAlign: 'left',
  gap: 1,
  flexWrap: 'wrap',
} as const;

/** A notification row: title, priority, date; opens to show the message and who sent it. */
export const NotificationCard: FC<NotificationCardProps> = ({
  notification,
  unread = false,
  chips,
  menu,
  onOpen,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();

  const toggle = (): void => {
    if (!expanded) onOpen?.();
    setExpanded(!expanded);
  };

  return (
    <Paper
      component="li"
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderLeft: `4px solid ${PRIORITY_STYLES[notification.priority].border}`,
        borderRadius: 0.5,
        overflow: 'hidden',
        bgcolor: backgroundOf(expanded, unread),
        listStyle: 'none',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
        <ButtonBase
          onClick={toggle}
          aria-expanded={expanded}
          aria-controls={detailsId}
          aria-label={t('messaging.notifications.toggle', { title: notification.title })}
          sx={SUMMARY_SX}
        >
          <NotificationSummary notification={notification} unread={unread} chips={chips} />
        </ButtonBase>
        {menu}
        <ExpandMoreIcon
          aria-hidden
          fontSize="small"
          sx={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}
        />
      </Box>
      <Collapse in={expanded} timeout="auto" unmountOnExit id={detailsId}>
        <Divider />
        <NotificationDetails notification={notification} />
      </Collapse>
    </Paper>
  );
};
