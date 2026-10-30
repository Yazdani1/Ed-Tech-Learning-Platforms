import { PricingPage } from '@/components/public/pricing/PricingPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Pricing' };

const PricingRoute = () => <PricingPage />;

export default PricingRoute;
