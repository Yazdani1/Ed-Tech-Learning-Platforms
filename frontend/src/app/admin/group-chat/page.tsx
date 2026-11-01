import { GroupChatPage } from '@/components/group-chat/GroupChatPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Group Chat' };

const AdminGroupChatPage = () => <GroupChatPage />;

export default AdminGroupChatPage;
