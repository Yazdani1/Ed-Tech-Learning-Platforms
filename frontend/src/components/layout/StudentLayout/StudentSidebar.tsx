import { useState } from 'react';
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
import BookIcon from '@mui/icons-material/Book';
import PersonIcon from '@mui/icons-material/Person';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../../context/useAuth';
import { useTranslation } from 'react-i18next';

const DRAWER_OPEN = 240;
const DRAWER_CLOSED = 64;

const navItems = [
	{ label: 'Home', icon: <HomeIcon />, path: '/', exact: true },
	{
		label: 'nav.dashboard',
		icon: <DashboardIcon />,
		path: '/student/dashboard',
	},
	{ label: 'Profile', icon: <PersonIcon />, path: '/student/profile' },
	{ label: 'nav.myCourses', icon: <BookIcon />, path: '/student/courses' },
	{ label: 'Pricing', icon: <CardMembershipIcon />, path: '/pricing' },
];

export default function StudentSidebar() {
	const [open, setOpen] = useState(true);
	const { user, logout } = useAuth();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();

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

			<List sx={{ flex: 1, pt: 1 }}>
				{navItems.map((item) => {
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
			</List>

			<Divider />

			<Box
				sx={{ p: open ? 2 : 1, display: 'flex', alignItems: 'center', gap: 1 }}
			>
				<Avatar
					sx={{
						width: 32,
						height: 32,
						bgcolor: 'secondary.main',
						fontSize: 14,
					}}
				>
					{user?.name?.[0]?.toUpperCase()}
				</Avatar>
				{open && (
					<Box sx={{ flex: 1, overflow: 'hidden' }}>
						<Typography variant='body2' sx={{ fontWeight: 600 }} noWrap>
							{user?.name}
						</Typography>
						<Typography variant='caption' color='text.secondary' noWrap>
							Student
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
