import { PricingPage } from '@/components/public/pricing/PricingPage';
import { PageVisibilityGate } from '@/components/public/common/PageVisibilityGate';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Pricing' };

// Hidden from the Site Pages screen: "Page not found"
const PricingRoute = () => (
  <PageVisibilityGate pageKey="pricing">
    <PricingPage />
  </PageVisibilityGate>
);

export default PricingRoute;
