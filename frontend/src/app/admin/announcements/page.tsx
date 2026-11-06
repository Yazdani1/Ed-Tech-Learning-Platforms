import { AnnouncementsPage } from '@/components/announcements/AnnouncementsPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Announcements' };

const AdminAnnouncementsPage = () => <AnnouncementsPage />;

export default AdminAnnouncementsPage;
