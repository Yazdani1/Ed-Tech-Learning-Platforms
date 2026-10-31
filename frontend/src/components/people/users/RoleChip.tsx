'use client';

import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import { ROLE_CHIP_COLOR, ROLE_KEY } from './user-utils';

import type { UserRole } from '@/types';
import type { FC } from 'react';

interface RoleChipProps {
  role: UserRole;
}

/** The coloured role badge used in the list and the details. */
export const RoleChip: FC<RoleChipProps> = ({ role }) => {
  const { t } = useTranslation();
  return (
    <Chip
      label={t(`people.roles.${ROLE_KEY[role]}`)}
      size="small"
      color={ROLE_CHIP_COLOR[role]}
      variant="outlined"
      sx={{ fontWeight: 700 }}
    />
  );
};
