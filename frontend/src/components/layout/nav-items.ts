import BarChart from '@mui/icons-material/BarChart';
import Book from '@mui/icons-material/Book';
import CardMembership from '@mui/icons-material/CardMembership';
import Category from '@mui/icons-material/Category';
import Chat from '@mui/icons-material/Chat';
import Collections from '@mui/icons-material/Collections';
import Dashboard from '@mui/icons-material/Dashboard';
import EventNote from '@mui/icons-material/EventNote';
import Groups from '@mui/icons-material/Groups';
import Home from '@mui/icons-material/Home';
import Notifications from '@mui/icons-material/Notifications';
import People from '@mui/icons-material/People';
import Person from '@mui/icons-material/Person';
import QuestionAnswer from '@mui/icons-material/QuestionAnswer';
import School from '@mui/icons-material/School';

import { MANAGER_ROLES, SUPER_ADMIN_ROLES } from '@/utils/roles';

import type { UserRole } from '@/types';
import type SvgIcon from '@mui/material/SvgIcon';

export interface NavItem {
  /** i18n key of the menu text */
  labelKey: string;
  href: string;
  icon: typeof SvgIcon;
  /** Only these roles see the item (default: everyone allowed in the area) */
  roles?: readonly UserRole[];
  /** Active only on this exact path (default: also on its sub-pages) */
  exact?: boolean;
  /** Shown under a heading after the main items */
  section?: 'analytics';
  /** Unread badge on the icon (support chat / notifications), as the old sidebars had */
  badge?: 'chat' | 'notifications';
}

/**
 * Admin area menu (Super Admin, Admin, Moderator): the old AdminSidebar's items and roles, plus Group Chat
 * (the old sidebar had no link to /admin/group-chat; added so the page can be reached).
 */
export const ADMIN_NAV: readonly NavItem[] = [
  { labelKey: 'nav.home', href: '/', icon: Home, exact: true },
  {
    labelKey: 'nav.dashboard',
    href: '/admin/dashboard',
    icon: Dashboard,
    roles: SUPER_ADMIN_ROLES,
  },
  { labelKey: 'nav.profile', href: '/admin/profile', icon: Person },
  { labelKey: 'nav.courses', href: '/admin/courses', icon: School },
  { labelKey: 'nav.courseQa', href: '/admin/course-qa', icon: QuestionAnswer },
  { labelKey: 'nav.schedule', href: '/admin/schedule', icon: EventNote },
  { labelKey: 'nav.supportChat', href: '/admin/chat', icon: Chat, badge: 'chat' },
  { labelKey: 'nav.groupChat', href: '/admin/group-chat', icon: Groups },
  {
    labelKey: 'nav.notifications',
    href: '/admin/notifications',
    icon: Notifications,
    badge: 'notifications',
  },
  {
    labelKey: 'nav.homepageShowcase',
    href: '/admin/homepage-showcase',
    icon: Collections,
    roles: MANAGER_ROLES,
  },
  { labelKey: 'nav.teachers', href: '/admin/teachers', icon: Person, roles: MANAGER_ROLES },
  { labelKey: 'nav.courseSetup', href: '/admin/categories', icon: Category, roles: MANAGER_ROLES },
  { labelKey: 'nav.userList', href: '/admin/users', icon: People, roles: MANAGER_ROLES },
  {
    labelKey: 'nav.subscriptions',
    href: '/admin/subscriptions',
    icon: CardMembership,
    roles: MANAGER_ROLES,
  },
  {
    labelKey: 'nav.performance',
    href: '/admin/performance',
    icon: BarChart,
    roles: SUPER_ADMIN_ROLES,
    section: 'analytics',
  },
];

/** Student area menu, same items as the old StudentSidebar. */
export const STUDENT_NAV: readonly NavItem[] = [
  { labelKey: 'nav.home', href: '/', icon: Home, exact: true },
  { labelKey: 'nav.dashboard', href: '/student/dashboard', icon: Dashboard },
  { labelKey: 'nav.profile', href: '/student/profile', icon: Person },
  { labelKey: 'nav.myCourses', href: '/student/courses', icon: Book },
  { labelKey: 'nav.pricing', href: '/pricing', icon: CardMembership },
  { labelKey: 'nav.supportChat', href: '/student/chat', icon: Chat, badge: 'chat' },
  { labelKey: 'nav.groupChat', href: '/student/group-chat', icon: Groups },
  { labelKey: 'nav.schedule', href: '/student/schedule', icon: EventNote },
  {
    labelKey: 'nav.notifications',
    href: '/student/notifications',
    icon: Notifications,
    badge: 'notifications',
  },
];

/** Teacher area menu, same items as the old TeacherLayout. */
export const TEACHER_NAV: readonly NavItem[] = [
  { labelKey: 'nav.home', href: '/', icon: Home, exact: true },
  { labelKey: 'nav.assignedCourses', href: '/teacher/courses', icon: School },
  { labelKey: 'nav.profile', href: '/teacher/profile', icon: Person, exact: true },
  { labelKey: 'nav.schedule', href: '/teacher/schedule', icon: EventNote },
  { labelKey: 'nav.supportChat', href: '/teacher/chat', icon: Chat, badge: 'chat' },
  {
    labelKey: 'nav.notifications',
    href: '/teacher/notifications',
    icon: Notifications,
    badge: 'notifications',
  },
];

/** True when the menu item belongs to the page being shown. */
export const isNavItemActive = (item: NavItem, pathname: string): boolean =>
  item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
