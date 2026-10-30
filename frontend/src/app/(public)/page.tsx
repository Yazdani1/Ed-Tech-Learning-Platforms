import { HomePage } from '@/components/public/home/HomePage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Home' };

const HomeRoute = () => <HomePage />;

export default HomeRoute;
