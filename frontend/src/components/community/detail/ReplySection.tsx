'use client';

import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { LoadMoreButton } from '../common/LoadMoreButton';
import { useCommunityPermissions } from '../common/useCommunityPermissions';

import { ReplyComposer } from './ReplyComposer';
import { ReplyItem } from './ReplyItem';

import type { CommunityBadge, Reply } from '@/schemas/community.schema';
import type { FC } from 'react';

interface ReplySectionProps {
  postId: string;
  postAuthorId: string | undefined;
  replies: Reply[];
  badges: CommunityBadge[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

/** Reply button/form, the answers (accepted first, as the server sorts them) and "Load more answers". */
export const ReplySection: FC<ReplySectionProps> = ({
  postId,
  postAuthorId,
  replies,
  badges,
  hasMore,
  loadingMore,
  onLoadMore,
}) => {
  const { t } = useTranslation();
  const { isMine } = useCommunityPermissions();

  return (
    <>
      <ReplyComposer postId={postId} />
      <Divider />
      <Stack
        component="section"
        aria-label={t('community.reply.title')}
        spacing={2}
        sx={{ p: { xs: 1.5, sm: 2.5 }, bgcolor: 'action.hover' }}
      >
        {replies.length === 0 && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            {t('community.reply.none')}
          </Typography>
        )}
        {replies.length > 0 && (
          <Stack
            component="ul"
            divider={<Divider component="li" aria-hidden />}
            spacing={1}
            sx={{ m: 0, p: 0 }}
          >
            {replies.map((reply) => (
              <ReplyItem
                key={reply._id}
                reply={reply}
                postId={postId}
                isPostAuthor={isMine(postAuthorId)}
                badges={badges}
              />
            ))}
          </Stack>
        )}
        {hasMore && (
          <LoadMoreButton
            label={t('community.reply.loadMore')}
            loadingLabel={t('community.reply.loadingMore')}
            loading={loadingMore}
            onClick={onLoadMore}
          />
        )}
      </Stack>
    </>
  );
};
