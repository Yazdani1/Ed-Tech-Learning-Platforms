import { StaffChatPage } from '@/components/chat/StaffChatPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Support Chat' };

const AdminSupportChatPage = () => <StaffChatPage />;

export default AdminSupportChatPage;
