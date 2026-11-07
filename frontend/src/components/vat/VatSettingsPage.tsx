'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useVatSetting } from '@/api/site-settings.api';
import { AuditHistoryList } from '@/components/common/AuditHistoryList';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { RequireRole } from '@/components/permissions/RequireRole';
import { auditValue } from '@/schemas/audit.schema';
import { SUPER_ADMIN_ROLES } from '@/utils/roles';

import { VatForm } from './VatForm';

const CARD_SX = { p: { xs: 2, sm: 3 }, maxWidth: 720, mb: 2.5, boxShadow: 1 } as const;

/**
 * /admin/vat (Super Admin): the VAT % included in every paid course price (internal: students never see it).
 * Each new paid enrolment records the rate in force and its VAT amount; the history shows every change.
 */
export const VatSettingsPage = () => {
  const { t } = useTranslation();
  const query = useVatSetting();
  return (
    <RequireRole roles={SUPER_ADMIN_ROLES}>
      <Box>
        <PageHeader title={t('vat.title')} />
        <QueryState
          isLoading={query.isPending}
          error={query.error}
          onRetry={() => void query.refetch()}
        >
          {query.data && (
            <>
              <Card variant="outlined" sx={CARD_SX}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {t('vat.info')}
                </Alert>
                {/* Remounted after a save so the form starts from the saved rate */}
                <VatForm key={query.data.vatPercent} current={query.data.vatPercent} />
              </Card>
              <Card variant="outlined" sx={CARD_SX}>
                <Typography component="h2" sx={{ fontWeight: 700, mb: 1 }}>
                  {t('vat.history')}
                </Typography>
                <AuditHistoryList
                  entries={query.data.history}
                  isPending={false}
                  error={null}
                  onRetry={() => void query.refetch()}
                  label={t('vat.history')}
                  describe={(entry) =>
                    t('vat.change', {
                      from: auditValue(entry.before, 'vatPercent') || '0',
                      to: auditValue(entry.after, 'vatPercent') || '0',
                    })
                  }
                />
              </Card>
            </>
          )}
        </QueryState>
      </Box>
    </RequireRole>
  );
};
