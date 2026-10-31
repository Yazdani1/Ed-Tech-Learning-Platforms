'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';
import { isCloudinaryUrl } from '@/utils/urls';

import { RoleChip } from './RoleChip';
import { UserDetailsGrid } from './UserDetailsGrid';
import { getInitials } from './user-utils';

import type { ManagedUser } from '@/schemas/people.schema';
import type { FC } from 'react';

interface UserDetailsModalProps {
  open: boolean;
  user: ManagedUser | undefined;
  onClose: () => void;
}

const AVATAR_SIZE = 104;

/** Super Admin only: the account with its enrolment and spending summaries and subscription. */
export const UserDetailsModal: FC<UserDetailsModalProps> = ({ open, user, onClose }) => {
  const { t } = useTranslation();
  if (!user) return null;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t('people.users.detailsTitle')}
      cancelLabel={t('common.close')}
      maxWidth="md"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
        <Avatar
          src={isCloudinaryUrl(user.avatar) ? user.avatar : undefined}
          alt={user.name}
          sx={{ width: AVATAR_SIZE, height: AVATAR_SIZE, fontSize: 34, fontWeight: 900, mb: 1.5 }}
        >
          {getInitials(user.name)}
        </Avatar>
        <Typography variant="h5" component="p" sx={{ fontWeight: 800, textAlign: 'center' }}>
          {user.name}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <RoleChip role={user.role} />
        </Box>
      </Box>
      <UserDetailsGrid user={user} />
    </AppModal>
  );
};
