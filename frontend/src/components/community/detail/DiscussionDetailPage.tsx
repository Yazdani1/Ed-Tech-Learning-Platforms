'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { useCommunityPost } from '@/api/community.api';
import { QueryState } from '@/components/common/QueryState';

import { DiscussionView } from './DiscussionView';

import type { FC } from 'react';

const NOT_FOUND = 404;

interface DiscussionDetailPageProps {
  postId: string;
}

/** /community-hub/[postId]: the discussion, its answers with nested replies, and related discussions. */
export const DiscussionDetailPage: FC<DiscussionDetailPageProps> = ({ postId }) => {
  const { t } = useTranslation();
  const query = useCommunityPost(postId);
  const pages = query.data?.pages ?? [];
  const detail = pages[0]?.detail ?? null;
  const replies = pages.flatMap((page) => page.replies);

  return (
    <Box sx={{ bgcolor: 'grey.50', flex: 1, py: { xs: 2, md: 4 } }}>
      <Container maxWidth="lg">
        <Stack spacing={2.5}>
          <Button
            component={Link}
            href="/community-hub"
            startIcon={<ArrowBackIcon />}
            sx={{ alignSelf: 'flex-start', minHeight: 44 }}
          >
            {t('community.detail.back')}
          </Button>
          {query.error?.status === NOT_FOUND ? (
            <Paper
              elevation={0}
              sx={{ p: 4, textAlign: 'center', border: 1, borderColor: 'divider' }}
            >
              <Typography sx={{ fontWeight: 800 }}>{t('community.detail.notFound')}</Typography>
            </Paper>
          ) : (
            <QueryState
              isLoading={query.isPending}
              error={query.error}
              onRetry={() => void query.refetch()}
              skeletonRows={6}
            >
              {detail && (
                <DiscussionView
                  detail={detail}
                  replies={replies}
                  answerCount={pages[pages.length - 1]?.total ?? replies.length}
                  hasMore={query.hasNextPage}
                  loadingMore={query.isFetchingNextPage}
                  onLoadMore={() => void query.fetchNextPage()}
                />
              )}
            </QueryState>
          )}
        </Stack>
      </Container>
    </Box>
  );
};
