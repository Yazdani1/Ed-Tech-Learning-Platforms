'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useBroadcasts } from '@/api/announcements.api';
import { ListPagination } from '@/components/common/ListPagination';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { CardGridSkeleton } from '@/components/common/skeletons/CardGridSkeleton';
import { PAGE_SIZE } from '@/hooks/useClientPagination';
import { useModal } from '@/hooks/useModal';

import { BroadcastCard } from './BroadcastCard';
import { BroadcastDetailsDrawer } from './BroadcastDetailsDrawer';
import { BroadcastFormModal } from './BroadcastFormModal';

import type { Broadcast } from '@/schemas/announcement-broadcast.schema';

/** Height of one announcement card (title, preview, poster line, chips) */
const BROADCAST_CARD_HEIGHT = 168;

/**
 * /admin/announcements (Super Admin, Admin, Moderator): send one announcement to several published courses
 * (each course shows it in its announcements), and every sent one with its "seen by" count and details.
 */
export const AnnouncementsPage = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const list = useBroadcasts(page, PAGE_SIZE);
  const form = useModal();
  const details = useModal<Broadcast>();
  const items = list.data?.items ?? [];

  return (
    <Box>
      <PageHeader
        title={t('announcements.title')}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              form.openModal();
            }}
            sx={{ minHeight: 44 }}
          >
            {t('announcements.add')}
          </Button>
        }
      />
      <QueryState
        isLoading={list.isPending}
        error={list.error}
        onRetry={() => void list.refetch()}
        isEmpty={items.length === 0}
        emptyText={t('announcements.empty')}
        skeleton={<CardGridSkeleton count={4} columns="1fr" height={BROADCAST_CARD_HEIGHT} />}
      >
        <Stack spacing={1.5} component="section" aria-label={t('announcements.listLabel')}>
          {items.map((item) => (
            <BroadcastCard key={item._id} item={item} onOpen={details.openModal} />
          ))}
        </Stack>
        {list.data && (
          <ListPagination
            page={list.data.page}
            limit={list.data.limit}
            total={list.data.total}
            onPageChange={setPage}
          />
        )}
      </QueryState>
      {form.open && <BroadcastFormModal onClose={form.closeModal} />}
      <BroadcastDetailsDrawer
        id={details.data?._id}
        open={details.open}
        onClose={details.closeModal}
      />
    </Box>
  );
};
