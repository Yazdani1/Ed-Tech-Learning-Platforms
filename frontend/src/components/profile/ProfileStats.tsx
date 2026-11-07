'use client';

import Grid from '@mui/material/Grid';

import { ProfileStatCard } from './ProfileStatCard';
import { useProfileStatCards } from './useProfileStatCards';

import type { Profile } from '@/schemas/profile.schema';
import type { FC } from 'react';

const STAT_SIZE = { xs: 12, sm: 6, md: 'grow' } as const;

interface ProfileStatsProps {
  profile: Profile;
}

/**
 * Course count (enrolled for students, assigned for teachers), purchases, time on the portal (students), plan
 * (students: only with a plan or a subscription course) and profile status.
 */
export const ProfileStats: FC<ProfileStatsProps> = ({ profile }) => {
  const cards = useProfileStatCards(profile);
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {cards.map(({ key, ...card }) => (
        <Grid key={key} size={STAT_SIZE}>
          <ProfileStatCard {...card} />
        </Grid>
      ))}
    </Grid>
  );
};
