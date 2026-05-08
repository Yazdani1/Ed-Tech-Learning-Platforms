import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
	Box,
	Drawer,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	IconButton,
	Divider,
	Tooltip,
	Avatar,
	Typography,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';
import PeopleIcon from '@mui/icons-material/People';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import BarChartIcon from '@mui/icons-material/BarChart';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../../context/useAuth';
import { useTranslation } from 'react-i18next';

const DRAWER_OPEN = 240;
const DRAWER_CLOSED = 64;

const navItems = [
	{
		label: 'Home',
		icon: <HomeIcon />,
		path: '/',
		exact: true,
		roles: ['Super Admin', 'Admin', 'Moderator'],
	},
	{
		label: 'nav.dashboard',
		icon: <DashboardIcon />,
		path: '/admin/dashboard',
		roles: ['Super Admin'],
	},
	{
		label: 'Profile',
		icon: <PersonIcon />,
		path: '/admin/profile',
		roles: ['Super Admin', 'Admin', 'Moderator'],
	},
	{
		label: 'nav.courses',
		icon: <SchoolIcon />,
		path: '/admin/courses',
		roles: ['Super Admin', 'Admin', 'Moderator'],
	},
	{
		label: 'All Course Q & A',
		icon: <QuestionAnswerIcon />,
		path: '/admin/course-qa',
		roles: ['Super Admin', 'Admin', 'Moderator'],
	},
	{
		label: 'nav.teachers',
		icon: <PersonIcon />,
		path: '/admin/teachers',
		roles: ['Super Admin', 'Admin'],
	},
	{
		label: 'Course Setup',
		icon: <CategoryIcon />,
		path: '/admin/categories',
		roles: ['Super Admin', 'Admin'],
	},
	{
		label: 'User List',
		icon: <PeopleIcon />,
		path: '/admin/users',
		roles: ['Super Admin', 'Admin'],
	},
	{
		label: 'nav.subscriptions',
		icon: <CardMembershipIcon />,
		path: '/admin/subscriptions',
		roles: ['Super Admin', 'Admin'],
	},
];

const superAdminItems = [
	{ label: 'Performance', icon: <BarChartIcon />, path: '/admin/performance' },
];

export default function AdminSidebar() {
	const { user, logout } = useAuth();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();

	const isCourseCreateEditPage =
		location.pathname.includes('/courses/create') ||
		location.pathname.includes('/edit');
	const [open, setOpen] = useState(!isCourseCreateEditPage);

	useEffect(() => {
		if (isCourseCreateEditPage) setOpen(false);
	}, [isCourseCreateEditPage]);

	const handleLogout = async () => {
		await logout();
		navigate('/auth/login');
	};

	return (
		<Drawer
			variant='permanent'
			sx={{
				width: open ? DRAWER_OPEN : DRAWER_CLOSED,
				flexShrink: 0,
				'& .MuiDrawer-paper': {
					width: open ? DRAWER_OPEN : DRAWER_CLOSED,
					overflowX: 'hidden',
					transition: 'width 0.2s ease',
					boxSizing: 'border-box',
					borderRight: '1px solid',
					borderColor: 'divider',
				},
			}}
		>
			{/* Header */}
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: open ? 'space-between' : 'center',
					px: open ? 2 : 1,
					py: 1.5,
					minHeight: 64,
				}}
			>
				{open && (
					<Typography
						variant='h6'
						sx={{ fontWeight: 700, color: 'primary.main' }}
						noWrap
					>
						MedhaBee
					</Typography>
				)}
				<IconButton onClick={() => setOpen((p) => !p)} size='small'>
					{open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
				</IconButton>
			</Box>

			<Divider />

			{/* Nav items */}
			<List sx={{ flex: 1, pt: 1 }}>
				{navItems
					.filter((item) => !user?.role || item.roles.includes(user.role))
					.map((item) => {
						const active = item.exact
							? location.pathname === item.path
							: location.pathname.startsWith(item.path);
						return (
							<Tooltip
								key={item.path}
								title={open ? '' : t(item.label)}
								placement='right'
							>
								<ListItemButton
									onClick={() => navigate(item.path)}
									selected={active}
									sx={{
										mx: 1,
										borderRadius: 2,
										mb: 0.5,
										minHeight: 44,
										justifyContent: open ? 'initial' : 'center',
										px: open ? 2 : 1.5,
									}}
								>
									<ListItemIcon
										sx={{
											minWidth: 0,
											mr: open ? 2 : 0,
											color: active ? 'primary.main' : 'inherit',
										}}
									>
										{item.icon}
									</ListItemIcon>
									{open && <ListItemText primary={t(item.label)} />}
								</ListItemButton>
							</Tooltip>
						);
					})}

				{/* Super Admin only items */}
				{user?.role === 'Super Admin' && (
					<>
						{open && (
							<Typography
								variant='caption'
								sx={{
									px: 2,
									pt: 1.5,
									pb: 0.5,
									display: 'block',
									color: 'text.disabled',
									fontWeight: 700,
									letterSpacing: 0.5,
								}}
							>
								ANALYTICS
							</Typography>
						)}
						{superAdminItems.map((item) => {
							const active = location.pathname.startsWith(item.path);
							return (
								<Tooltip
									key={item.path}
									title={open ? '' : item.label}
									placement='right'
								>
									<ListItemButton
										onClick={() => navigate(item.path)}
										selected={active}
										sx={{
											mx: 1,
											borderRadius: 2,
											mb: 0.5,
											minHeight: 44,
											justifyContent: open ? 'initial' : 'center',
											px: open ? 2 : 1.5,
										}}
									>
										<ListItemIcon
											sx={{
												minWidth: 0,
												mr: open ? 2 : 0,
												color: active ? 'primary.main' : 'inherit',
											}}
										>
											{item.icon}
										</ListItemIcon>
										{open && <ListItemText primary={item.label} />}
									</ListItemButton>
								</Tooltip>
							);
						})}
					</>
				)}
			</List>

			<Divider />

			{/* User + Logout */}
			<Box
				sx={{ p: open ? 2 : 1, display: 'flex', alignItems: 'center', gap: 1 }}
			>
				<Avatar
					sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}
				>
					{user?.name?.[0]?.toUpperCase()}
				</Avatar>
				{open && (
					<Box sx={{ flex: 1, overflow: 'hidden' }}>
						<Typography variant='body2' sx={{ fontWeight: 600 }} noWrap>
							{user?.name}
						</Typography>
						<Typography variant='caption' color='text.secondary' noWrap>
							{user?.role}
						</Typography>
					</Box>
				)}
				<Tooltip title={t('nav.logout')}>
					<IconButton size='small' onClick={() => void handleLogout()}>
						<LogoutIcon fontSize='small' />
					</IconButton>
				</Tooltip>
			</Box>
		</Drawer>
	);
}
