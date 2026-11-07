import { OfflinePage } from '@/components/pwa/OfflinePage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Offline' };

const Offline = () => <OfflinePage />;

export default Offline;
