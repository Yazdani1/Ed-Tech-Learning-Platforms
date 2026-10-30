import { ProfilePage } from '@/components/profile/ProfilePage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Profile' };

const MyProfilePage = () => <ProfilePage />;

export default MyProfilePage;
