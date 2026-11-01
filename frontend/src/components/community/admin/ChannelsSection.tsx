'use client';

import Stack from '@mui/material/Stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAdminChannels, useArchiveChannel } from '@/api/community.api';
import { QueryState } from '@/components/common/QueryState';
import { useToastResult } from '@/hooks/useToastResult';
import { htmlToPlainText } from '@/utils/html-text';

import { AdminItemRow } from './AdminItemRow';
import { ChannelForm } from './ChannelForm';
import { SectionTitleBar } from './SectionTitleBar';
import { useArchiveConfirm } from './useArchiveConfirm';

import type { CommunityChannel } from '@/schemas/community.schema';

/** The form is closed, open for a new channel, or open for this channel. */
type FormState = { open: false } | { open: true; channel: CommunityChannel | undefined };

/** Every hub channel (archived last) with create, edit and archive. */
export const ChannelsSection = () => {
  const { t } = useTranslation();
  const channels = useAdminChannels();
  const archive = useArchiveChannel();
  const confirmArchive = useArchiveConfirm();
  const toastResult = useToastResult();
  const [form, setForm] = useState<FormState>({ open: false });

  const archiveChannel = async (channel: CommunityChannel): Promise<void> => {
    if (!(await confirmArchive(channel.name))) return;
    await toastResult(archive.mutateAsync(channel._id), t('community.admin.channelArchived'));
  };

  return (
    <Stack spacing={2}>
      <SectionTitleBar
        title={t('community.admin.sections.channels')}
        createLabel={t('community.admin.createChannel')}
        onCreate={() => {
          setForm({ open: true, channel: undefined });
        }}
      />
      {form.open && (
        <ChannelForm
          key={form.channel?._id ?? 'new'}
          channel={form.channel}
          onDone={() => {
            setForm({ open: false });
          }}
        />
      )}
      <QueryState
        isLoading={channels.isPending}
        error={channels.error}
        isEmpty={channels.data?.length === 0}
        emptyText={t('community.admin.noChannels')}
        onRetry={() => void channels.refetch()}
      >
        <Stack component="ul" spacing={1} sx={{ m: 0, p: 0 }}>
          {(channels.data ?? []).map((channel) => (
            <AdminItemRow
              key={channel._id}
              name={channel.name}
              imageUrl={channel.imageUrl}
              caption={htmlToPlainText(channel.description)}
              isArchived={channel.isArchived === true}
              onEdit={() => {
                setForm({ open: true, channel });
              }}
              onArchive={() => void archiveChannel(channel)}
            />
          ))}
        </Stack>
      </QueryState>
    </Stack>
  );
};
