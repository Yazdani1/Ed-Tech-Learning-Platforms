import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
	Avatar,
	Box,
	Drawer,
	IconButton,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Tooltip,
	Typography,
	Divider,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import ChatIcon from '@mui/icons-material/Chat';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Badge from '@mui/material/Badge';
import { useAuth } from '../../../context/useAuth';
import { useChat } from '../../../context/ChatContext';
import { useNotifications } from '../../../context/NotificationContext';

const DRAWER_OPEN = 220;
const DRAWER_CLOSED = 64;

export default function TeacherLayout() {
	const { user, logout } = useAuth();
	const { totalUnread } = useChat();
	const { unreadCount } = useNotifications();
	const navigate = useNavigate();
	const location = useLocation();
	const isLearningPage = location.pathname.includes('/learn');
	const [open, setOpen] = useState(!isLearningPage);

	useEffect(() => {
		if (isLearningPage) setOpen(false);
	}, [isLearningPage]);

	const handleLogout = async () => {
		await logout();
		navigate('/auth/login');
	};

	return (
		<Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'grey.50' }}>
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
						<Typography variant='h6' sx={{ fontWeight: 700, color: 'primary.main' }} noWrap>
							MedhaBee
						</Typography>
					)}
					<IconButton onClick={() => setOpen((p) => !p)} size='small'>
						{open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
					</IconButton>
				</Box>

				<Divider />

				<List sx={{ flex: 1, pt: 1 }}>
					<Tooltip title={open ? '' : 'Home'} placement='right'>
						<ListItemButton
							onClick={() => navigate('/')}
							selected={location.pathname === '/'}
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
									color: location.pathname === '/' ? 'primary.main' : 'inherit',
								}}
							>
								<HomeIcon />
							</ListItemIcon>
							{open && <ListItemText primary='Home' />}
						</ListItemButton>
					</Tooltip>
					<Tooltip title={open ? '' : 'Assigned courses'} placement='right'>
						<ListItemButton
							onClick={() => navigate('/teacher/courses')}
							selected={location.pathname.startsWith('/teacher/courses')}
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
									color: location.pathname.startsWith('/teacher/courses') ? 'primary.main' : 'inherit',
								}}
							>
								<SchoolIcon />
							</ListItemIcon>
							{open && <ListItemText primary='Assigned courses' />}
						</ListItemButton>
					</Tooltip>
					<Tooltip title={open ? '' : 'Profile'} placement='right'>
						<ListItemButton
							onClick={() => navigate('/teacher/profile')}
							selected={location.pathname === '/teacher/profile'}
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
									color: location.pathname === '/teacher/profile' ? 'primary.main' : 'inherit',
								}}
							>
								<PersonIcon />
							</ListItemIcon>
							{open && <ListItemText primary='Profile' />}
						</ListItemButton>
					</Tooltip>
					<Tooltip title={open ? '' : 'Support Chat'} placement='right'>
						<ListItemButton
							onClick={() => navigate('/teacher/chat')}
							selected={location.pathname.startsWith('/teacher/chat')}
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
									color: location.pathname.startsWith('/teacher/chat') ? 'primary.main' : 'inherit',
								}}
							>
								<Badge badgeContent={totalUnread} color='error' invisible={totalUnread === 0}>
									<ChatIcon />
								</Badge>
							</ListItemIcon>
							{open && <ListItemText primary='Support Chat' />}
						</ListItemButton>
					</Tooltip>
					<Tooltip title={open ? '' : 'Notifications'} placement='right'>
						<ListItemButton
							onClick={() => navigate('/teacher/notifications')}
							selected={location.pathname.startsWith('/teacher/notifications')}
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
									color: location.pathname.startsWith('/teacher/notifications') ? 'primary.main' : 'inherit',
								}}
							>
								<Badge badgeContent={unreadCount} color='error' invisible={unreadCount === 0}>
									<NotificationsIcon />
								</Badge>
							</ListItemIcon>
							{open && <ListItemText primary='Notifications' />}
						</ListItemButton>
					</Tooltip>
				</List>

				<Divider />

				{/* User + Logout */}
				<Box sx={{ p: open ? 2 : 1, display: 'flex', alignItems: 'center', gap: 1 }}>
				<Avatar src={user?.avatar} sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
					{user?.name?.[0]?.toUpperCase()}
				</Avatar>
					{open && (
						<Box sx={{ flex: 1, overflow: 'hidden' }}>
							<Typography variant='body2' sx={{ fontWeight: 600 }} noWrap>
								{user?.name}
							</Typography>
							<Typography variant='caption' color='text.secondary' noWrap>
								Teacher
							</Typography>
						</Box>
					)}
					<Tooltip title='Logout'>
						<IconButton size='small' onClick={() => void handleLogout()}>
							<LogoutIcon fontSize='small' />
						</IconButton>
					</Tooltip>
				</Box>
			</Drawer>

			<Box component='main' sx={{ flex: 1, overflow: isLearningPage ? 'hidden' : 'auto', p: isLearningPage ? 0 : 3 }}>
				<Outlet />
			</Box>
		</Box>
	);
}
