import { PublicTeachersPage } from '@/components/public/teachers/PublicTeachersPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Teachers' };

const TeachersRoute = () => <PublicTeachersPage />;

export default TeachersRoute;
