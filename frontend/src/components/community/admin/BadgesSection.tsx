'use client';

import Stack from '@mui/material/Stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useArchiveBadge, useCommunityBadges } from '@/api/community.api';
import { QueryState } from '@/components/common/QueryState';
import { useToastResult } from '@/hooks/useToastResult';

import { AdminItemRow } from './AdminItemRow';
import { BadgeForm } from './BadgeForm';
import { SectionTitleBar } from './SectionTitleBar';
import { useArchiveConfirm } from './useArchiveConfirm';

import type { CommunityBadge } from '@/schemas/community.schema';

type FormState = { open: false } | { open: true; badge: CommunityBadge | undefined };

/** Every badge (archived last) with create, edit and archive. */
export const BadgesSection = () => {
  const { t } = useTranslation();
  const badges = useCommunityBadges();
  const archive = useArchiveBadge();
  const confirmArchive = useArchiveConfirm();
  const toastResult = useToastResult();
  const [form, setForm] = useState<FormState>({ open: false });

  const archiveBadge = async (badge: CommunityBadge): Promise<void> => {
    if (!(await confirmArchive(badge.name))) return;
    await toastResult(archive.mutateAsync(badge._id), t('community.admin.badgeArchived'));
  };

  return (
    <Stack spacing={2}>
      <SectionTitleBar
        title={t('community.admin.sections.badges')}
        createLabel={t('community.admin.createBadge')}
        onCreate={() => {
          setForm({ open: true, badge: undefined });
        }}
      />
      {form.open && (
        <BadgeForm
          key={form.badge?._id ?? 'new'}
          badge={form.badge}
          onDone={() => {
            setForm({ open: false });
          }}
        />
      )}
      <QueryState
        isLoading={badges.isPending}
        error={badges.error}
        isEmpty={badges.data?.length === 0}
        emptyText={t('community.admin.noBadges')}
        onRetry={() => void badges.refetch()}
      >
        <Stack component="ul" spacing={1} sx={{ m: 0, p: 0 }}>
          {(badges.data ?? []).map((badge) => (
            <AdminItemRow
              key={badge._id}
              name={badge.name}
              imageUrl={badge.imageUrl}
              caption={t('community.admin.badgePoints', { count: badge.requiredPoints })}
              isArchived={badge.isArchived === true}
              onEdit={() => {
                setForm({ open: true, badge });
              }}
              onArchive={() => void archiveBadge(badge)}
            />
          ))}
        </Stack>
      </QueryState>
    </Stack>
  );
};
