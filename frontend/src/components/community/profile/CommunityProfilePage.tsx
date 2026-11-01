'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { useCommunityProfile } from '@/api/community.api';
import { QueryState } from '@/components/common/QueryState';

import { initial, safeImage } from '../common/community-utils';

import { PublicProfile } from './PublicProfile';

import type { FC } from 'react';

const NOT_FOUND = 404;
const cardSx = { p: 4, border: 1, borderColor: 'divider', textAlign: 'center' } as const;

interface CommunityProfilePageProps {
  userId: string;
}

/** /community-hub/users/[userId]: a member's stats, discussions, answers and badges (or "private"). */
export const CommunityProfilePage: FC<CommunityProfilePageProps> = ({ userId }) => {
  const { t } = useTranslation();
  const query = useCommunityProfile(userId);
  const profile = query.data;

  return (
    <Box sx={{ bgcolor: 'grey.50', flex: 1, py: { xs: 2, md: 4 } }}>
      <Container maxWidth={false} sx={{ maxWidth: 1440, px: { xs: 2, md: 3 } }}>
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
            <Paper elevation={0} sx={cardSx}>
              {t('community.profile.notFound')}
            </Paper>
          ) : (
            <QueryState
              isLoading={query.isPending}
              error={query.error}
              onRetry={() => void query.refetch()}
            >
              {profile?.isPrivate === true && (
                <Paper elevation={0} sx={cardSx}>
                  <Avatar
                    src={safeImage(profile.user.avatar)}
                    alt=""
                    sx={{ width: 84, height: 84, mx: 'auto', mb: 2 }}
                  >
                    {initial(profile.user.name)}
                  </Avatar>
                  <Typography variant="h6" component="p" sx={{ fontWeight: 800 }}>
                    {profile.user.name}
                  </Typography>
                  <Typography variant="h5" component="h1" sx={{ fontWeight: 900 }}>
                    {t('community.profile.private')}
                  </Typography>
                </Paper>
              )}
              {profile?.isPrivate === false && <PublicProfile profile={profile} />}
            </QueryState>
          )}
        </Stack>
      </Container>
    </Box>
  );
};
