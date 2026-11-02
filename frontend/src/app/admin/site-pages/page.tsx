import { SitePagesPage } from '@/components/site-settings/SitePagesPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Site Pages' };

const AdminSitePagesPage = () => <SitePagesPage />;

export default AdminSitePagesPage;
