import { PurchasesPage } from '@/components/purchases/PurchasesPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Purchases' };

const MyPurchasesPage = () => <PurchasesPage />;

export default MyPurchasesPage;
