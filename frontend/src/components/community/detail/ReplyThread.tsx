'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useCommunityPermissions } from '../common/useCommunityPermissions';

import { ChildReplyForm } from './ChildReplyForm';
import { ChildReplyItem } from './ChildReplyItem';
import { ThreadButtons } from './ThreadButtons';

import type { CommunityBadge, Reply } from '@/schemas/community.schema';
import type { FC } from 'react';

const barSx = {
  alignItems: { xs: 'stretch', sm: 'center' },
  justifyContent: 'space-between',
  gap: 1,
};
const nestedSx = { pl: { xs: 1.5, sm: 4 }, borderLeft: 2, borderColor: 'divider' };

interface ReplyThreadProps {
  reply: Reply;
  badges: CommunityBadge[];
  /** The reaction bar of the answer, shown on the left of the thread buttons */
  reactions: ReactNode;
}

/** Under an answer: its reactions, "Replies (n)", "Reply" (signed in) and the nested replies. */
export const ReplyThread: FC<ReplyThreadProps> = ({ reply, badges, reactions }) => {
  const { t } = useTranslation();
  const { user } = useCommunityPermissions();
  const [expanded, setExpanded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const children = reply.childReplies ?? [];
  const count = reply.childReplyCount ?? children.length;
  const showList = expanded && count > 0;

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={barSx}>
        <Box sx={{ flex: 1, minWidth: 0 }}>{reactions}</Box>
        <ThreadButtons
          count={count}
          expanded={expanded}
          canReply={user !== null}
          onToggle={() => {
            setExpanded((value) => !value);
          }}
          onReply={() => {
            setFormOpen((value) => !value);
          }}
        />
      </Stack>
      {(formOpen || showList) && (
        <Stack spacing={1} sx={nestedSx}>
          {formOpen && (
            <ChildReplyForm
              replyId={reply._id}
              onDone={(posted) => {
                setFormOpen(false);
                if (posted) setExpanded(true);
              }}
            />
          )}
          {showList && (
            <Box component="ul" aria-label={t('community.reply.repliesTo')} sx={{ m: 0, p: 0 }}>
              {children.map((child) => (
                <ChildReplyItem key={child._id} childReply={child} badges={badges} />
              ))}
            </Box>
          )}
        </Stack>
      )}
    </>
  );
};
