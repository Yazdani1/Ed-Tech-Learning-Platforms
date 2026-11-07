'use client';

import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HistoryIcon from '@mui/icons-material/History';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import { useTranslation } from 'react-i18next';

import { ActionMenu } from '@/components/common/ActionMenu';

import type { FC } from 'react';

interface RowMenuProps {
  /** Accessible name of the "⋮" button */
  label: string;
  isActive: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  /** Promos: who switched it on / off and when */
  onHistory?: () => void;
}

/** "⋮" menu of a coupon or promo row: Edit, switch on / off, History (promos), Delete. */
export const CouponRowMenu: FC<RowMenuProps> = ({
  label,
  isActive,
  onEdit,
  onToggle,
  onDelete,
  onHistory,
}) => {
  const { t } = useTranslation();
  return (
    <ActionMenu
      label={label}
      items={[
        { label: t('common.edit'), icon: <EditOutlinedIcon fontSize="small" />, onClick: onEdit },
        {
          label: t(isActive ? 'coupons.deactivate' : 'coupons.activate'),
          icon: isActive ? (
            <ToggleOffOutlinedIcon fontSize="small" />
          ) : (
            <ToggleOnOutlinedIcon fontSize="small" />
          ),
          onClick: onToggle,
        },
        {
          label: t('promos.history.open'),
          icon: <HistoryIcon fontSize="small" />,
          visible: Boolean(onHistory),
          onClick: () => onHistory?.(),
        },
        {
          label: t('common.delete'),
          icon: <DeleteOutlinedIcon fontSize="small" />,
          danger: true,
          onClick: onDelete,
        },
      ]}
    />
  );
};
