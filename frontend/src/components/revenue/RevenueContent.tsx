'use client';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/common/PageHeader';

import { MonthDetailView } from './MonthDetailView';
import { MonthlySalesView } from './MonthlySalesView';
import { SalesPanel } from './SalesPanel';
import { REVENUE_VIEWS, useRevenueParams, type RevenueView } from './useRevenueParams';

/**
 * The Revenue page body (inside the role check and Suspense of RevenuePage): the Monthly sales tab (month
 * cards, then one month's details) and the All sales tab (every order with period, course and type filters).
 */
export const RevenueContent = () => {
  const { t } = useTranslation();
  const revenue = useRevenueParams();
  const { params, setParams } = revenue;

  return (
    <Box>
      <PageHeader title={t('revenue.title')} />
      <Tabs
        value={params.view}
        onChange={(_event, view: RevenueView) => {
          setParams({ view, month: '', period: '', from: '', to: '' });
        }}
        aria-label={t('revenue.tabs.label')}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}
      >
        {REVENUE_VIEWS.map((view) => (
          <Tab
            key={view}
            value={view}
            label={t(`revenue.tabs.${view}`)}
            sx={{ minHeight: 48, textTransform: 'none', fontWeight: 600 }}
          />
        ))}
      </Tabs>
      {params.view === 'monthly' && !params.month && (
        <MonthlySalesView
          onOpen={(month) => {
            setParams({ month });
          }}
        />
      )}
      {params.view === 'monthly' && params.month && (
        <MonthDetailView
          month={params.month}
          revenue={revenue}
          onBack={() => {
            setParams({ month: '', courses: '', type: '' });
          }}
        />
      )}
      {params.view === 'all' && <SalesPanel revenue={revenue} showPeriod fileName="sales" />}
    </Box>
  );
};
