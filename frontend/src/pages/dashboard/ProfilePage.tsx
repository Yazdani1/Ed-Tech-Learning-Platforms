import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Grid,
	Paper,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/useAuth';
import { authService } from '../../services/auth.service';
import { courseService } from '../../services/course.service';
import { subscriptionService } from '../../services/subscription.service';
import { subscriptionPlanConfigService } from '../../services/subscriptionPlanConfig.service';
import { teacherService } from '../../services/teacher.service';
import type { ICourse, ISubscriptionPlanConfig } from '../../types/index';
import { formatDate, formatDateTime } from '../../utils/dateTime';

const ROLE_COLORS: Record<string, string> = {
	'Super Admin': '#7c3aed',
	Admin: '#1565c0',
	Moderator: '#0f766e',
	Teacher: '#d97706',
	Student: '#16a34a',
};

function InfoItem({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
}) {
	return (
		<Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
			<Box sx={{ color: 'primary.main', display: 'flex', mt: 0.2 }}>{icon}</Box>
			<Box sx={{ minWidth: 0 }}>
				<Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
					{label}
				</Typography>
				<Typography sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
					{value}
				</Typography>
			</Box>
		</Box>
	);
}

function StatCard({
	icon,
	label,
	value,
	helper,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	helper: string;
}) {
	return (
		<Paper
			variant='outlined'
			sx={{
				p: 2.25,
				borderRadius: 1,
				height: '100%',
				bgcolor: 'background.paper',
			}}
		>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
				<Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
				<Typography variant='body2' color='text.secondary' sx={{ fontWeight: 700 }}>
					{label}
				</Typography>
			</Box>
			<Typography variant='h4' sx={{ fontWeight: 900, lineHeight: 1 }}>
				{value}
			</Typography>
			<Typography variant='caption' color='text.secondary' sx={{ mt: 0.75, display: 'block' }}>
				{helper}
			</Typography>
		</Paper>
	);
}

export default function ProfilePage() {
	const { user, refreshUser } = useAuth();
	const navigate = useNavigate();
	const [planConfig, setPlanConfig] = useState<ISubscriptionPlanConfig | null>(null);
	const [enrolledCourses, setEnrolledCourses] = useState<ICourse[]>([]);
	const [teacherCourses, setTeacherCourses] = useState<ICourse[]>([]);
	const [editOpen, setEditOpen] = useState(false);
	const [cancelOpen, setCancelOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [cancelling, setCancelling] = useState(false);
	const [form, setForm] = useState({
		name: '',
		email: '',
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
		removeAvatar: false,
	});
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string>('');

	const sub = user?.activeSubscription;
	const isStudent = user?.role === 'Student';
	const isTeacher = user?.role === 'Teacher';
	const subActive = sub && new Date(sub.endDate) > new Date();
	const roleColor = user ? ROLE_COLORS[user.role] ?? '#1565c0' : '#1565c0';

	useEffect(() => {
		if (!user) return;
		setForm((prev) => ({
			...prev,
			name: user.name,
			email: user.email,
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',
			removeAvatar: false,
		}));
		setAvatarPreview(user.avatar ?? '');
		setAvatarFile(null);
	}, [user]);

	useEffect(() => {
		if (!sub) {
			setPlanConfig(null);
			return;
		}
		subscriptionPlanConfigService
			.getAll()
			.then((res) => {
				const configs: ISubscriptionPlanConfig[] = Array.isArray(res.data) ? res.data : [];
				setPlanConfig(configs.find((c) => c.plan === sub.plan) ?? null);
			})
			.catch(() => {});
	}, [sub?.plan]);

	useEffect(() => {
		if (!user) return;
		if (user.role === 'Student') {
			courseService
				.getEnrolled()
				.then((res) => setEnrolledCourses(res.data ?? []))
				.catch(() => setEnrolledCourses([]));
		}
		if (user.role === 'Teacher') {
			teacherService
				.getMyCourses()
				.then((res) => setTeacherCourses(res.data ?? []))
				.catch(() => setTeacherCourses([]));
		}
	}, [user]);

	useEffect(() => {
		if (!avatarFile) return;
		const url = URL.createObjectURL(avatarFile);
		setAvatarPreview(url);
		return () => URL.revokeObjectURL(url);
	}, [avatarFile]);

	const roleDescription = useMemo(() => {
		if (!user) return '';
		if (user.role === 'Student') return 'Learner account with course access, subscriptions, study materials, and Q&A.';
		if (user.role === 'Teacher') return 'Instructor account with assigned courses, learning content, and student support tools.';
		if (user.role === 'Moderator') return 'Operations account for course and community oversight.';
		return 'Administrative account with platform management access.';
	}, [user]);

	const handleAvatarChange = (file?: File) => {
		if (!file) return;
		setAvatarFile(file);
		setForm((prev) => ({ ...prev, removeAvatar: false }));
	};

	const handleSave = async () => {
		if (!form.name.trim() || !form.email.trim()) {
			toast.error('Name and email are required');
			return;
		}
		if (form.newPassword || form.confirmPassword || form.currentPassword) {
			if (!form.currentPassword) {
				toast.error('Current password is required to change password');
				return;
			}
			if (form.newPassword.length < 6) {
				toast.error('New password must be at least 6 characters');
				return;
			}
			if (form.newPassword !== form.confirmPassword) {
				toast.error('New passwords do not match');
				return;
			}
		}

		const fd = new FormData();
		fd.append('name', form.name.trim());
		fd.append('email', form.email.trim());
		if (avatarFile) fd.append('avatar', avatarFile);
		if (form.removeAvatar) fd.append('removeAvatar', 'true');
		if (form.newPassword) {
			fd.append('currentPassword', form.currentPassword);
			fd.append('newPassword', form.newPassword);
		}

		setSaving(true);
		try {
			await authService.updateMe(fd);
			await refreshUser();
			toast.success('Profile updated');
			setEditOpen(false);
		} finally {
			setSaving(false);
		}
	};

	const handleCancel = async () => {
		setCancelling(true);
		try {
			await subscriptionService.cancelMy();
			await refreshUser();
			toast.success('Subscription cancelled');
			setCancelOpen(false);
		} catch {
			toast.error('Failed to cancel subscription');
		} finally {
			setCancelling(false);
		}
	};

	if (!user) {
		return (
			<Box>
				<Typography variant='h5' sx={{ fontWeight: 800, mb: 2 }}>
					My Profile
				</Typography>
				<Typography color='text.secondary'>Loading profile...</Typography>
			</Box>
		);
	}

	const activeCourseCount = isStudent ? enrolledCourses.length : isTeacher ? teacherCourses.length : 0;

	return (
		<Box sx={{ maxWidth: 1180, mx: 'auto' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start', mb: 3 }}>
				<Box>
					<Typography variant='h4' sx={{ fontWeight: 900, lineHeight: 1.2 }}>
						My Profile
					</Typography>
					<Typography variant='body1' color='text.secondary' sx={{ mt: 0.75 }}>
						Manage your account, membership, and role-based learning information.
					</Typography>
				</Box>
				<Button
					variant='contained'
					startIcon={<EditOutlinedIcon />}
					onClick={() => setEditOpen(true)}
					sx={{ fontWeight: 800, flexShrink: 0 }}
				>
					Edit Profile
				</Button>
			</Box>

			<Paper
				elevation={0}
				sx={{
					overflow: 'hidden',
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: 1,
					mb: 3,
					bgcolor: 'background.paper',
				}}
			>
				<Box
					sx={{
						minHeight: 150,
						background:
							'linear-gradient(135deg, #0f766e 0%, #1565c0 55%, #7c3aed 100%)',
						position: 'relative',
						px: { xs: 2, md: 4 },
						py: 3,
						color: 'white',
					}}
				>
					<Chip
						icon={<VerifiedUserOutlinedIcon />}
						label={user.role}
						sx={{
							color: 'white',
							bgcolor: 'rgba(255,255,255,0.16)',
							border: '1px solid rgba(255,255,255,0.22)',
							fontWeight: 800,
							'& .MuiChip-icon': { color: 'white' },
						}}
					/>
				</Box>

				<Box sx={{ px: { xs: 2, md: 4 }, pb: 4 }}>
					<Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-end', flexWrap: 'wrap', mt: -7 }}>
						<Avatar
							src={user.avatar}
							alt={user.name}
							sx={{
								width: 132,
								height: 132,
								border: '5px solid white',
								bgcolor: roleColor,
								fontSize: 48,
								fontWeight: 900,
								boxShadow: '0 18px 42px rgba(15,23,42,0.2)',
							}}
						>
							{user.name[0]?.toUpperCase()}
						</Avatar>
						<Box sx={{ flex: 1, minWidth: 260, pt: 8 }}>
							<Typography variant='h4' sx={{ fontWeight: 900, lineHeight: 1.1 }}>
								{user.name}
							</Typography>
							<Typography color='text.secondary' sx={{ mt: 0.75 }}>
								{roleDescription}
							</Typography>
						</Box>
					</Box>

					<Divider sx={{ my: 3 }} />

					<Grid container spacing={3}>
						<Grid size={{ xs: 12, md: 8 }}>
							<Grid container spacing={2.5}>
								<Grid size={{ xs: 12, sm: 6 }}>
									<InfoItem icon={<EmailOutlinedIcon />} label='Email' value={user.email} />
								</Grid>
								<Grid size={{ xs: 12, sm: 6 }}>
									<InfoItem icon={<BadgeOutlinedIcon />} label='Role' value={user.role} />
								</Grid>
								<Grid size={{ xs: 12, sm: 6 }}>
									<InfoItem icon={<CalendarTodayIcon />} label='Joined' value={formatDateTime(user.createdAt)} />
								</Grid>
								<Grid size={{ xs: 12, sm: 6 }}>
									<InfoItem icon={<SecurityOutlinedIcon />} label='Last updated' value={user.updatedAt ? formatDateTime(user.updatedAt) : 'Not available'} />
								</Grid>
							</Grid>
						</Grid>
						<Grid size={{ xs: 12, md: 4 }}>
							<Paper variant='outlined' sx={{ p: 2, borderRadius: 1, bgcolor: 'grey.50' }}>
								<Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>
									Account access
								</Typography>
								<Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.7 }}>
									Only you can edit this profile from this page. Role changes remain restricted to platform administrators.
								</Typography>
							</Paper>
						</Grid>
					</Grid>
				</Box>
			</Paper>

			<Grid container spacing={3} sx={{ mb: 3 }}>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard icon={<MenuBookIcon />} label={isTeacher ? 'Assigned courses' : 'Enrolled courses'} value={String(activeCourseCount)} helper={isTeacher ? 'Courses you teach' : 'Courses in your learning list'} />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard icon={<SchoolOutlinedIcon />} label='Purchased courses' value={String(user.purchasedCourses?.length ?? 0)} helper='Direct course purchases' />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard icon={<CardMembershipIcon />} label='Subscription' value={subActive ? sub.plan : 'None'} helper={subActive ? `Expires ${formatDate(sub.endDate)}` : 'No active plan'} />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard icon={<AccountCircleIcon />} label='Profile status' value={user.avatar ? 'Complete' : 'Basic'} helper={user.avatar ? 'Avatar added' : 'Add an avatar anytime'} />
				</Grid>
			</Grid>

			<Grid container spacing={3}>
				{isStudent && (
					<Grid size={{ xs: 12, lg: 7 }}>
						<Paper variant='outlined' sx={{ p: 3, borderRadius: 1, height: '100%' }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
								<CardMembershipIcon sx={{ color: '#7c3aed' }} />
								<Typography variant='h6' sx={{ fontWeight: 900 }}>
									Subscription
								</Typography>
							</Box>
							{subActive ? (
								<>
									<Box sx={{ p: 2.5, borderRadius: 1, border: '1px solid', borderColor: '#7c3aed', bgcolor: 'rgba(124,58,237,0.04)', mb: 2.5 }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
											<Chip label={sub.plan} size='small' sx={{ bgcolor: '#7c3aed', color: 'white', fontWeight: 800 }} />
											<Chip label='Active' size='small' color='success' />
										</Box>
										<Grid container spacing={2}>
											<Grid size={{ xs: 12, sm: 4 }}>
												<InfoItem icon={<CalendarTodayIcon />} label='Started' value={formatDate(sub.startDate)} />
											</Grid>
											<Grid size={{ xs: 12, sm: 4 }}>
												<InfoItem icon={<CalendarTodayIcon />} label='Expires' value={formatDate(sub.endDate)} />
											</Grid>
											{planConfig && (
												<Grid size={{ xs: 12, sm: 4 }}>
													<InfoItem icon={<MenuBookIcon />} label='Included' value={`${planConfig.courseCount} courses`} />
												</Grid>
											)}
										</Grid>
										{planConfig?.features?.length ? (
											<Box sx={{ mt: 2 }}>
												<Divider sx={{ mb: 1.5 }} />
												<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
													{planConfig.features.map((feature, index) => (
														<Chip key={index} label={feature} size='small' variant='outlined' />
													))}
												</Box>
											</Box>
										) : null}
									</Box>
									<Stack direction='row' spacing={1.5} sx={{ flexWrap: 'wrap' }}>
										<Button variant='outlined' onClick={() => navigate('/pricing')}>Change Plan</Button>
										<Button variant='outlined' color='error' onClick={() => setCancelOpen(true)}>Cancel Subscription</Button>
									</Stack>
								</>
							) : (
								<Box sx={{ p: 2.5, borderRadius: 1, border: '1px dashed', borderColor: 'divider' }}>
									<Typography color='text.secondary' sx={{ mb: 1.5 }}>
										You do not have an active subscription.
									</Typography>
									<Button variant='contained' onClick={() => navigate('/pricing')}>View Plans</Button>
								</Box>
							)}
						</Paper>
					</Grid>
				)}

				<Grid size={{ xs: 12, lg: isStudent ? 5 : 12 }}>
					<Paper variant='outlined' sx={{ p: 3, borderRadius: 1, height: '100%' }}>
						<Typography variant='h6' sx={{ fontWeight: 900, mb: 2 }}>
							Role details
						</Typography>
						<Grid container spacing={2}>
							<Grid size={{ xs: 12, sm: 6 }}>
								<InfoItem icon={<BadgeOutlinedIcon />} label='Role' value={user.role} />
							</Grid>
							<Grid size={{ xs: 12, sm: 6 }}>
								<InfoItem icon={<SecurityOutlinedIcon />} label='Permissions' value={user.role === 'Student' ? 'Learner access' : user.role === 'Teacher' ? 'Teaching access' : 'Management access'} />
							</Grid>
							<Grid size={{ xs: 12 }}>
								<Divider />
							</Grid>
							<Grid size={{ xs: 12 }}>
								<Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.8 }}>
									{roleDescription}
								</Typography>
							</Grid>
						</Grid>
					</Paper>
				</Grid>
			</Grid>

			<Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth='sm' fullWidth>
				<DialogTitle sx={{ fontWeight: 900 }}>Edit Profile</DialogTitle>
				<DialogContent dividers>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
						<Avatar src={form.removeAvatar ? '' : avatarPreview} sx={{ width: 86, height: 86, bgcolor: roleColor, fontSize: 32, fontWeight: 900 }}>
							{form.name[0]?.toUpperCase()}
						</Avatar>
						<Box>
							<Button component='label' variant='outlined' startIcon={<PhotoCameraOutlinedIcon />} size='small'>
								Upload Avatar
								<input hidden type='file' accept='image/*' onChange={(e) => handleAvatarChange(e.target.files?.[0])} />
							</Button>
							{(avatarPreview || avatarFile) && (
								<Button
									size='small'
									color='error'
									onClick={() => {
										setAvatarFile(null);
										setAvatarPreview('');
										setForm((prev) => ({ ...prev, removeAvatar: true }));
									}}
									sx={{ ml: 1 }}
								>
									Remove
								</Button>
							)}
							<Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
								JPG, PNG, or WEBP up to 5MB.
							</Typography>
						</Box>
					</Box>

					<Grid container spacing={2}>
						<Grid size={{ xs: 12 }}>
							<TextField label='Name' fullWidth required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
						</Grid>
						<Grid size={{ xs: 12 }}>
							<TextField label='Email' type='email' fullWidth required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
						</Grid>
						<Grid size={{ xs: 12 }}>
							<Divider sx={{ my: 1 }} />
							<Typography variant='subtitle2' sx={{ fontWeight: 900, mb: 1 }}>
								Change password
							</Typography>
							<Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
								Leave these fields empty if you do not want to change your password.
							</Typography>
						</Grid>
						<Grid size={{ xs: 12 }}>
							<TextField label='Current password' type='password' fullWidth value={form.currentPassword} onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))} slotProps={{ input: { startAdornment: <LockOutlinedIcon fontSize='small' color='action' sx={{ mr: 1 }} /> } }} />
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField label='New password' type='password' fullWidth value={form.newPassword} onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))} />
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField label='Confirm new password' type='password' fullWidth value={form.confirmPassword} onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))} />
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
					<Button variant='contained' disabled={saving} onClick={() => void handleSave()}>
						{saving ? <CircularProgress size={18} color='inherit' /> : 'Save Changes'}
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth='xs' fullWidth>
				<DialogTitle>Cancel Subscription</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to cancel your <strong>{sub?.plan}</strong> subscription?
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setCancelOpen(false)} disabled={cancelling}>Keep It</Button>
					<Button variant='contained' color='error' disabled={cancelling} onClick={() => void handleCancel()}>
						{cancelling ? <CircularProgress size={18} color='inherit' /> : 'Cancel Subscription'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
