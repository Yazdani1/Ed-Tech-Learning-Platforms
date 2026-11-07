'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/common/PageHeader';
import { useModal } from '@/hooks/useModal';

import { PromoDesignTab } from './design/PromoDesignTab';
import { PromoFormModal } from './PromoFormModal';
import { PromoHistoryModal } from './PromoHistoryModal';
import { PromosTable } from './PromosTable';

import type { Promo } from '@/schemas/promo.schema';

const TABS = ['promos', 'design'] as const;
type PromoTab = (typeof TABS)[number];
const TAB_SX = { textTransform: 'none', fontWeight: 600, minHeight: 48 } as const;

/** The Promos page body: header, tabs (promo list / custom banner and pop-up pictures), the form and history. */
export const PromosContent = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<PromoTab>('promos');
  const modal = useModal<Promo>();
  const historyModal = useModal<Promo>();

  return (
    <Box>
      <PageHeader
        title={t('promos.title')}
        actions={
          tab === 'promos' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                modal.openModal();
              }}
              sx={{ minHeight: 44 }}
            >
              {t('promos.add')}
            </Button>
          )
        }
      />
      <Tabs
        value={tab}
        onChange={(_event, next: PromoTab) => {
          setTab(next);
        }}
        aria-label={t('promos.tabs.label')}
        sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map((item) => (
          <Tab key={item} value={item} label={t(`promos.tabs.${item}`)} sx={TAB_SX} />
        ))}
      </Tabs>
      {tab === 'promos' ? (
        <PromosTable onEdit={modal.openModal} onHistory={historyModal.openModal} />
      ) : (
        <PromoDesignTab />
      )}
      <PromoFormModal open={modal.open} promo={modal.data} onClose={modal.closeModal} />
      {historyModal.open && historyModal.data && (
        <PromoHistoryModal promo={historyModal.data} onClose={historyModal.closeModal} />
      )}
    </Box>
  );
};
