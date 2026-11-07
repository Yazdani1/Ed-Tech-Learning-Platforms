import { VatSettingsPage } from '@/components/vat/VatSettingsPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Set up VAT' };

const AdminVatPage = () => <VatSettingsPage />;

export default AdminVatPage;
