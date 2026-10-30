'use client';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import type { SetupKind } from '@/schemas/setup.schema';
import type { FC } from 'react';

interface SetupTabsProps {
  kind: SetupKind;
}

const TABS: { kind: SetupKind; href: string }[] = [
  { kind: 'category', href: '/admin/categories' },
  { kind: 'courseType', href: '/admin/course-types' },
];

/** Links between the two course setup lists (each has its own address). */
export const SetupTabs: FC<SetupTabsProps> = ({ kind }) => {
  const { t } = useTranslation();
  return (
    <Tabs
      value={kind}
      aria-label={t('showcase.setup.tabsLabel')}
      variant="fullWidth"
      sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider', maxWidth: { sm: 480 } }}
    >
      {TABS.map((tab) => (
        <Tab
          key={tab.kind}
          value={tab.kind}
          label={t(`showcase.setup.${tab.kind}.plural`)}
          component={Link}
          href={tab.href}
          sx={{ minHeight: 48, fontWeight: 700 }}
        />
      ))}
    </Tabs>
  );
};
