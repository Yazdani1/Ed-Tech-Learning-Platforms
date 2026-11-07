'use client';

import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/hooks/useModal';
import { useUrlListParams } from '@/hooks/useUrlListParams';
import { MANAGER_ROLES } from '@/utils/roles';

import { EditNotificationModal } from './EditNotificationModal';
import { InboxPanel } from './InboxPanel';
import { SendNotificationPanel } from './SendNotificationPanel';
import { SentPanel } from './SentPanel';

import type { Notification } from '@/schemas/notifications.schema';

const TABS = ['send', 'all', 'sent'] as const;
type NotificationTab = (typeof TABS)[number];

const paramsSchema = z.object({
  tab: z.enum(TABS).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
});

/**
 * Notifications for every signed-in role: the inbox (paged, mark one/all read). Super Admin and Admin
 * also send notifications and manage the sent ones (the backend allows only them).
 */
export const NotificationsScreen = () => {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const canSend = hasRole(MANAGER_ROLES);
  const { params, setParams } = useUrlListParams(paramsSchema);
  const editModal = useModal<Notification>();
  const tab: NotificationTab = canSend ? (params.tab ?? 'send') : 'all';
  const onPageChange = (page: number): void => {
    setParams({ page });
  };

  return (
    <>
      <PageHeader title={t('messaging.notifications.title')} />
      {canSend && (
        <Paper elevation={0} sx={{ mb: 3, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Tabs
            value={tab}
            onChange={(_event, value: NotificationTab) => {
              setParams({ tab: value });
            }}
            variant="scrollable"
            allowScrollButtonsMobile
            aria-label={t('messaging.notifications.tabsLabel')}
            sx={{ px: 1.5 }}
          >
            {TABS.map((value) => (
              <Tab key={value} value={value} label={t(`messaging.notifications.tabs.${value}`)} />
            ))}
          </Tabs>
        </Paper>
      )}
      {tab === 'send' && <SendNotificationPanel />}
      {tab === 'all' && <InboxPanel page={params.page} onPageChange={onPageChange} />}
      {tab === 'sent' && (
        <SentPanel page={params.page} onPageChange={onPageChange} onEdit={editModal.openModal} />
      )}
      {canSend && (
        <EditNotificationModal
          open={editModal.open}
          notification={editModal.data}
          onClose={editModal.closeModal}
        />
      )}
    </>
  );
};
