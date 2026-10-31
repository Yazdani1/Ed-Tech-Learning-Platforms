import { UsersPage } from '@/components/people/users/UsersPage';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'User List' };

const AdminUsersPage = () => <UsersPage />;

export default AdminUsersPage;
