'use client';

import EditOutlined from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/api/profile.api';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { useModal } from '@/hooks/useModal';

import { EditProfileModal } from './EditProfileModal';
import { ProfileHero } from './ProfileHero';
import { ProfileStats } from './ProfileStats';
import { RoleDetailsCard } from './RoleDetailsCard';
import { SubscriptionCard } from './SubscriptionCard';

const PAGE_MAX_WIDTH = 1180;

/** /admin/profile, /student/profile, /teacher/profile: the signed-in user's own account. */
export const ProfilePage = () => {
  const { t } = useTranslation();
  const query = useProfile();
  const modal = useModal();
  const profile = query.data;
  const isStudent = profile?.role === 'Student';

  return (
    <Box sx={{ maxWidth: PAGE_MAX_WIDTH, mx: 'auto' }}>
      <PageHeader
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
        actions={
          profile && (
            <Button
              variant="contained"
              startIcon={<EditOutlined />}
              onClick={() => {
                modal.openModal();
              }}
            >
              {t('profile.editProfile')}
            </Button>
          )
        }
      />
      <QueryState
        isLoading={query.isPending}
        error={query.error}
        onRetry={() => void query.refetch()}
        skeletonRows={6}
      >
        {profile && (
          <>
            <ProfileHero profile={profile} />
            <ProfileStats profile={profile} />
            <Grid container spacing={3}>
              {isStudent && (
                <Grid size={{ xs: 12, lg: 7 }}>
                  <SubscriptionCard profile={profile} />
                </Grid>
              )}
              <Grid size={{ xs: 12, lg: isStudent ? 5 : 12 }}>
                <RoleDetailsCard role={profile.role} />
              </Grid>
            </Grid>
            {modal.open && <EditProfileModal profile={profile} onClose={modal.closeModal} />}
          </>
        )}
      </QueryState>
    </Box>
  );
};
