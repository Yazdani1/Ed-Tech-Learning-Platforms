import { NotFoundView } from '@/components/errors/NotFoundView';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Page not found' };

const NotFound = () => <NotFoundView />;

export default NotFound;
