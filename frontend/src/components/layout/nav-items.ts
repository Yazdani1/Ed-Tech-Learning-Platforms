import BarChart from '@mui/icons-material/BarChart';
import Campaign from '@mui/icons-material/Campaign';
import Book from '@mui/icons-material/Book';
import CardMembership from '@mui/icons-material/CardMembership';
import Category from '@mui/icons-material/Category';
import Chat from '@mui/icons-material/Chat';
import Collections from '@mui/icons-material/Collections';
import ContactPhone from '@mui/icons-material/ContactPhone';
import Dashboard from '@mui/icons-material/Dashboard';
import EventNote from '@mui/icons-material/EventNote';
import Face from '@mui/icons-material/Face';
import Groups from '@mui/icons-material/Groups';
import Home from '@mui/icons-material/Home';
import LocalOffer from '@mui/icons-material/LocalOffer';
import Notifications from '@mui/icons-material/Notifications';
import People from '@mui/icons-material/People';
import Payments from '@mui/icons-material/Payments';
import Percent from '@mui/icons-material/Percent';
import Person from '@mui/icons-material/Person';
import ReceiptLong from '@mui/icons-material/ReceiptLong';
import QuestionAnswer from '@mui/icons-material/QuestionAnswer';
import School from '@mui/icons-material/School';
import ToggleOn from '@mui/icons-material/ToggleOn';

import { MANAGER_ROLES, SUPER_ADMIN_ROLES } from '@/utils/roles';

import type { UserRole } from '@/types';
import type SvgIcon from '@mui/material/SvgIcon';

/** Headings of the admin menu, in this order (i18n keys nav.group.<name>). */
export const NAV_SECTIONS = ['analytics', 'courses', 'people', 'communication', 'website'] as const;
export type NavSection = (typeof NAV_SECTIONS)[number];

export interface NavItem {
  /** i18n key of the menu text */
  labelKey: string;
  href: string;
  icon: typeof SvgIcon;
  /** Only these roles see the item (default: everyone allowed in the area) */
  roles?: readonly UserRole[];
  /** Active only on this exact path (default: also on its sub-pages) */
  exact?: boolean;
  /** Shown under that group's heading, after the items without a group */
  section?: NavSection;
  /** Unread badge on the icon (support chat / notifications), as the old sidebars had */
  badge?: 'chat' | 'notifications';
}

/**
 * Admin area menu (Super Admin, Admin, Moderator): the old AdminSidebar's items and roles, plus Group Chat
 * (the old sidebar had no link to /admin/group-chat; added so the page can be reached), grouped under headings.
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
  { labelKey: 'nav.schedule', href: '/admin/schedule', icon: EventNote },
  { labelKey: 'nav.courses', href: '/admin/courses', icon: School, section: 'courses' },
  {
    labelKey: 'nav.courseSetup',
    href: '/admin/categories',
    icon: Category,
    roles: MANAGER_ROLES,
    section: 'courses',
  },
  {
    labelKey: 'nav.teachers',
    href: '/admin/teachers',
    icon: Person,
    roles: MANAGER_ROLES,
    section: 'courses',
  },
  {
    labelKey: 'nav.promos',
    href: '/admin/promos',
    icon: LocalOffer,
    roles: MANAGER_ROLES,
    section: 'courses',
  },
  {
    labelKey: 'nav.courseQa',
    href: '/admin/course-qa',
    icon: QuestionAnswer,
    section: 'courses',
  },
  {
    labelKey: 'nav.userList',
    href: '/admin/users',
    icon: People,
    roles: MANAGER_ROLES,
    section: 'people',
  },
  {
    labelKey: 'nav.students',
    href: '/admin/students',
    icon: Face,
    roles: MANAGER_ROLES,
    section: 'people',
  },
  {
    labelKey: 'nav.subscriptions',
    href: '/admin/subscriptions',
    icon: CardMembership,
    roles: MANAGER_ROLES,
    section: 'people',
  },
  {
    labelKey: 'nav.supportChat',
    href: '/admin/chat',
    icon: Chat,
    badge: 'chat',
    section: 'communication',
  },
  {
    labelKey: 'nav.announcements',
    href: '/admin/announcements',
    icon: Campaign,
    section: 'communication',
  },
  { labelKey: 'nav.groupChat', href: '/admin/group-chat', icon: Groups, section: 'communication' },
  {
    labelKey: 'nav.notifications',
    href: '/admin/notifications',
    icon: Notifications,
    badge: 'notifications',
    section: 'communication',
  },
  {
    labelKey: 'nav.homepageShowcase',
    href: '/admin/homepage-showcase',
    icon: Collections,
    roles: MANAGER_ROLES,
    section: 'website',
  },
  {
    labelKey: 'nav.sitePages',
    href: '/admin/site-pages',
    icon: ToggleOn,
    roles: SUPER_ADMIN_ROLES,
    section: 'website',
  },
  {
    labelKey: 'nav.companyContact',
    href: '/admin/company-contact',
    icon: ContactPhone,
    roles: MANAGER_ROLES,
    section: 'website',
  },
  {
    labelKey: 'nav.revenue',
    href: '/admin/revenue',
    icon: Payments,
    roles: MANAGER_ROLES,
    section: 'analytics',
  },
  {
    labelKey: 'nav.performance',
    href: '/admin/performance',
    icon: BarChart,
    roles: SUPER_ADMIN_ROLES,
    section: 'analytics',
  },
  {
    labelKey: 'nav.vat',
    href: '/admin/vat',
    icon: Percent,
    roles: SUPER_ADMIN_ROLES,
    section: 'analytics',
  },
];

/** Student area menu: Home, My Courses, Profile, Purchases, then the rest. */
export const STUDENT_NAV: readonly NavItem[] = [
  { labelKey: 'nav.home', href: '/', icon: Home, exact: true },
  { labelKey: 'nav.myCourses', href: '/student/courses', icon: Book },
  { labelKey: 'nav.profile', href: '/student/profile', icon: Person },
  { labelKey: 'nav.purchases', href: '/student/purchases', icon: ReceiptLong },
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
