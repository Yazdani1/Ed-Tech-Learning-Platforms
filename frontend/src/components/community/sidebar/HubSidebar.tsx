'use client';

import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import { BadgeList } from './BadgeList';
import { MostAnsweredList } from './MostAnsweredList';
import { OnlineMembers } from './OnlineMembers';
import { SidebarSection } from './SidebarSection';
import { TopContributors } from './TopContributors';

import type { CommunityBadge, HubWidgets } from '@/schemas/community.schema';
import type { FC } from 'react';

const WIDGET_ITEMS = 5;

interface HubSidebarProps {
  widgets: HubWidgets;
  badges: CommunityBadge[];
}

/** Right column of the hub: most answered questions, top contributors, badges, online members. */
export const HubSidebar: FC<HubSidebarProps> = ({ widgets, badges }) => {
  const { t } = useTranslation();
  return (
    <Stack component="aside" spacing={2} aria-label={t('community.sidebar.label')}>
      <SidebarSection title={t('community.sidebar.mostAnswered')}>
        <MostAnsweredList posts={widgets.mostAnsweredPosts.slice(0, WIDGET_ITEMS)} />
      </SidebarSection>
      <SidebarSection title={t('community.sidebar.topContributors')}>
        <TopContributors contributors={widgets.topContributors.slice(0, WIDGET_ITEMS)} />
      </SidebarSection>
      <SidebarSection title={t('community.sidebar.badges')}>
        <BadgeList badges={badges} />
      </SidebarSection>
      <SidebarSection title={t('community.sidebar.online')}>
        <OnlineMembers members={widgets.onlineMembers.slice(0, WIDGET_ITEMS)} />
      </SidebarSection>
    </Stack>
  );
};
