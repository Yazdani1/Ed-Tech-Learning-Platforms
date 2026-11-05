'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { UserAvatar } from '@/components/common/UserAvatar';

import { PAYMENT_CARD_SX } from './payment-methods';

import type { TeacherRef } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface PaymentMentorCardProps {
  teachers: readonly (TeacherRef | null)[];
}

const AVATAR_SIZE = 44;

/** "Live mentorship support" under the order summary, with the course's first teacher when there is one. */
export const PaymentMentorCard: FC<PaymentMentorCardProps> = ({ teachers }) => {
  const { t } = useTranslation();
  const teacher = teachers.find((item) => item !== null);
  return (
    <Box sx={{ ...PAYMENT_CARD_SX, mt: 2, p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {teacher && (
        <UserAvatar name={teacher.name} avatar={teacher.profileImage} size={AVATAR_SIZE} />
      )}
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700 }}>{t('payment.mentorTitle')}</Typography>
        <Typography variant="body2" sx={{ color: '#475569' }}>
          {t('payment.mentorText')}
        </Typography>
      </Box>
    </Box>
  );
};
