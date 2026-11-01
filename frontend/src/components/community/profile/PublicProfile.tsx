'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import { ProfileBadges } from './ProfileBadges';
import { ProfileHero } from './ProfileHero';
import { answerItems, discussionItems } from './profile-items';
import { ProfileLinkList } from './ProfileLinkList';
import { ProfileStats } from './ProfileStats';

import type { PublicCommunityProfile } from '@/schemas/community.schema';
import type { FC } from 'react';

interface PublicProfileProps {
  profile: PublicCommunityProfile;
}

/** A visible profile: banner, counters, discussions, answers and badges. */
export const PublicProfile: FC<PublicProfileProps> = ({ profile }) => {
  const { t, i18n } = useTranslation();
  return (
    <>
      <ProfileHero user={profile.user} />
      <ProfileStats stats={profile.stats} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(0, 1fr)' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        <Stack spacing={2.5}>
          <ProfileLinkList
            title={t('community.profile.discussionsTitle')}
            items={discussionItems(profile.discussions, t, i18n.language)}
            emptyText={t('community.profile.noDiscussions')}
          />
          <ProfileLinkList
            title={t('community.profile.answersTitle')}
            items={answerItems(profile.answers, t)}
            emptyText={t('community.profile.noAnswers')}
          />
        </Stack>
        <ProfileBadges badges={profile.badges} />
      </Box>
    </>
  );
};
