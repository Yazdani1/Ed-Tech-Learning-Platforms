'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useBroadcast } from '@/api/announcements.api';
import { CloudImage } from '@/components/common/CloudImage';
import { PostedByLine } from '@/components/common/PostedByLine';
import { QueryState } from '@/components/common/QueryState';
import { SafeHtml } from '@/components/common/SafeHtml';
import { SideDrawer } from '@/components/common/SideDrawer';
import { StudentDetailSection } from '@/components/people/students/StudentDetailSection';
import { useAuth } from '@/hooks/useAuth';

import { BroadcastActions } from './BroadcastActions';
import { BroadcastBadges } from './BroadcastBadges';
import { BroadcastCourseList } from './BroadcastCourseList';

import type { FC } from 'react';

interface BroadcastDetailsDrawerProps {
  id: string | undefined;
  open: boolean;
  onClose: () => void;
}

const IMAGE_HEIGHT = 220;

/**
 * Right-side panel of one sent announcement: text, picture, who posted it, its courses and who saw it; Edit
 * (old text kept in History) and Delete (archived: hidden everywhere, kept in the database).
 */
export const BroadcastDetailsDrawer: FC<BroadcastDetailsDrawerProps> = ({ id, open, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const query = useBroadcast(open ? id : undefined);
  const item = query.data;
  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={t('announcements.details.title')}
      hideActions
      wide
    >
      <QueryState
        isLoading={query.isPending}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        {item && (
          <>
            <Typography component="h3" variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              {item.title}
            </Typography>
            <PostedByLine
              postedBy={item.postedBy}
              createdAt={item.createdAt}
              userId={user?._id ?? ''}
            />
            <BroadcastBadges seenCount={item.seenCount} edited={Boolean(item.editedAt)} />
            <BroadcastActions item={item} onDeleted={onClose} />
            {item.image?.url && (
              <Box sx={{ mb: 2 }}>
                <CloudImage
                  url={item.image.url}
                  alt=""
                  sizes="(max-width: 900px) 100vw, 820px"
                  sx={{ height: IMAGE_HEIGHT, borderRadius: 2 }}
                />
              </Box>
            )}
            <SafeHtml html={item.description} sx={{ mb: 3, lineHeight: 1.7 }} />
            <StudentDetailSection
              title={t('announcements.details.courses', { count: item.courseCount })}
            >
              <BroadcastCourseList courses={item.courses} />
            </StudentDetailSection>
          </>
        )}
      </QueryState>
    </SideDrawer>
  );
};
