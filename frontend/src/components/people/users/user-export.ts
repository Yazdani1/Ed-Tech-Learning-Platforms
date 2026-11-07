import { getUsers } from '@/api/people.api';
import { formatDate } from '@/utils/dateTime';
import { datedFileName, downloadCsv, toCsv } from '@/utils/export-file';

import { ROLE_KEY } from './user-utils';

import type { ManagedUser } from '@/schemas/people.schema';
import type { TFunction } from 'i18next';

const EXPORT_PAGE_SIZE = 100;
/** At most 5000 users in one export (50 pages) */
const EXPORT_MAX_PAGES = 50;

/** Every user of the current filters, read page by page (the list endpoint allows 100 per page). */
export const fetchAllUsers = async (
  query: Record<string, string | number>,
): Promise<ManagedUser[]> => {
  const users: ManagedUser[] = [];
  for (let page = 1; page <= EXPORT_MAX_PAGES; page += 1) {
    // Pages one after another: the next page depends on the total of the first
    const result = await getUsers({ ...query, page, limit: EXPORT_PAGE_SIZE });
    users.push(...result.data);
    if (page >= result.pagination.totalPages) break;
  }
  return users;
};

/** The users CSV: name, email, role, student ID, phone, status and joined date. */
export const exportUsersCsv = (
  t: TFunction,
  users: readonly ManagedUser[],
  language: string,
): void => {
  const c = (key: string): string => t(`people.users.csv.${key}`);
  const headers = [
    c('name'),
    c('email'),
    c('role'),
    c('studentNumber'),
    c('phone'),
    c('status'),
    c('joined'),
  ];
  const rows = users.map((user) => [
    user.name,
    user.email,
    t(`people.roles.${ROLE_KEY[user.role]}`),
    user.studentNumber,
    user.phone,
    t(user.isBlocked ? 'people.accountStatus.blocked' : 'people.accountStatus.active'),
    user.createdAt ? formatDate(user.createdAt, language) : '',
  ]);
  downloadCsv(toCsv(headers, rows), datedFileName('users', 'csv'));
};
