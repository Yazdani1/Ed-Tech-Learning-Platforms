import { useEffect, useState, type ReactNode, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Avatar,
	FormControl,
	InputLabel,
	Divider,
	MenuItem,
	Paper,
	Select,
	TextField,
	Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LinkIcon from '@mui/icons-material/Link';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import toast from 'react-hot-toast';
import AppModal from '../../components/common/AppModal';
import ItemActionMenu from '../../components/common/ItemActionMenu';
import { useConfirmModal } from '../../context/ConfirmModalContext';
import { courseService } from '../../services/course.service';
import { teacherService } from '../../services/teacher.service';
import { userService } from '../../services/user.service';
import type { ICourse, ITeacher, IUser } from '../../types/index';
import { formatDate } from '../../utils/dateTime';

const EMPTY_FORM = {
	name: '',
	bio: '',
	expertise: '',
	socialLinks: '',
	profileImage: null as File | null,
	userId: '',
};

const TeachersPage= () => {
	const { confirm } = useConfirmModal();
	const navigate = useNavigate();
	const [teachers, setTeachers] = useState<ITeacher[]>([]);
	const [teacherUsers, setTeacherUsers] = useState<IUser[]>([]);
	const [teacherCourseCounts, setTeacherCourseCounts] = useState<Record<string, number>>({});
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingTeacher, setEditingTeacher] = useState<ITeacher | null>(null);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [detailsTeacher, setDetailsTeacher] = useState<ITeacher | null>(null);
	const [detailsCourses, setDetailsCourses] = useState<ICourse[]>([]);
	const [detailsLoading, setDetailsLoading] = useState(false);
	const [form, setForm] = useState(EMPTY_FORM);
	const [profilePreviewUrl, setProfilePreviewUrl] = useState('');
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		loadTeachers();
		loadTeacherUsers();
	}, []);

	useEffect(() => {
		return () => {
			if (profilePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(profilePreviewUrl);
		};
	}, [profilePreviewUrl]);

	const loadTeachers = () => {
		teacherService
			.getAll()
			.then((res) => {
				const loadedTeachers = res.data ?? [];
				setTeachers(loadedTeachers);
				void loadTeacherCourseCounts(loadedTeachers);
			})
			.finally(() => setLoading(false));
	};

	const loadTeacherCourseCounts = async (loadedTeachers: ITeacher[]) => {
		if (loadedTeachers.length === 0) {
			setTeacherCourseCounts({});
			return;
		}

		try {
			const entries = await Promise.all(
				loadedTeachers.map(async (teacher) => {
					const res = await courseService.getAll({ teacher: teacher._id });
					return [teacher._id, res.data?.length ?? 0] as const;
				}),
			);
			setTeacherCourseCounts(Object.fromEntries(entries));
		} catch {
			setTeacherCourseCounts(Object.fromEntries(loadedTeachers.map((teacher) => [teacher._id, 0])));
		}
	};

	const loadTeacherUsers = () => {
		userService
			.getAll({ role: 'Teacher', limit: '100' })
			.then((res) => {
				setTeacherUsers(res.data ?? []);
			})
			.catch(() => {
				setTeacherUsers([]);
				toast.error('Failed to load teacher user accounts');
			});
	};

	const handleOpenDialog = (teacher?: ITeacher) => {
		if (teacher) {
			setEditingTeacher(teacher);
			setForm({
				name: teacher.name,
				bio: teacher.bio,
				expertise: teacher.expertise.join(', '),
				socialLinks: teacher.socialLinks ? JSON.stringify(teacher.socialLinks, null, 2) : '',
				profileImage: null,
				userId: teacher.userId ?? '',
			});
			setProfilePreviewUrl(teacher.profileImage ?? '');
		} else {
			setEditingTeacher(null);
			setForm(EMPTY_FORM);
			setProfilePreviewUrl('');
		}
		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
		setEditingTeacher(null);
		setForm(EMPTY_FORM);
		setProfilePreviewUrl('');
	};

	const handleProfileImageSelect = (file?: File) => {
		if (!file) return;
		if (profilePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(profilePreviewUrl);
		setForm((current) => ({ ...current, profileImage: file }));
		setProfilePreviewUrl(URL.createObjectURL(file));
	};

	const handleOpenDetails = async (teacher: ITeacher) => {
		setDetailsTeacher(teacher);
		setDetailsCourses([]);
		setDetailsOpen(true);
		setDetailsLoading(true);
		try {
			const res = await courseService.getAll({ teacher: teacher._id });
			const courses = res.data ?? [];
			setDetailsCourses(courses);
			setTeacherCourseCounts((prev) => ({ ...prev, [teacher._id]: courses.length }));
		} catch {
			toast.error('Failed to load assigned courses');
		} finally {
			setDetailsLoading(false);
		}
	};

	const handleCloseDetails = () => {
		setDetailsOpen(false);
		setDetailsTeacher(null);
		setDetailsCourses([]);
	};

	const getLinkableTeacherUsers = () => {
		const linkedUserIds = new Set(
			teachers
				.map((teacher) => teacher.userId)
				.filter((userId): userId is string => Boolean(userId)),
		);

		return teacherUsers.filter((user) => {
			if (editingTeacher?.userId === user._id) return true;
			return !linkedUserIds.has(user._id);
		});
	};

	const handleSave = async () => {
		if (!form.name.trim() || !form.bio.trim()) {
			toast.error('Name and bio are required');
			return;
		}
		setSaving(true);
		try {
			const fd = new FormData();
			fd.append('name', form.name);
			fd.append('bio', form.bio);
			fd.append('expertise', form.expertise);
			if (form.socialLinks.trim()) fd.append('socialLinks', form.socialLinks);
			if (form.profileImage) fd.append('profileImage', form.profileImage);
			fd.append('userId', form.userId);

			if (editingTeacher) {
				await teacherService.update(editingTeacher._id, fd);
				toast.success('Teacher updated');
			} else {
				await teacherService.create(fd);
				toast.success('Teacher created');
			}
			loadTeachers();
			handleCloseDialog();
		} catch {
			toast.error('Failed to save teacher');
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (id: string) => {
		const confirmed = await confirm({
			title: 'Delete Teacher',
			message: 'Are you sure you want to delete this teacher?',
			confirmText: 'Delete Teacher',
			cancelText: 'Keep Teacher',
		});
		if (!confirmed) return;
		try {
			await teacherService.delete(id);
			toast.success('Teacher deleted');
			loadTeachers();
		} catch {
			toast.error('Failed to delete teacher');
		}
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
				<Typography variant='h4' sx={{ fontWeight: 700 }}>
					Teachers
				</Typography>
				<Button variant='contained' startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
					Add Teacher
				</Button>
			</Box>

			{loading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
					<CircularProgress />
				</Box>
			) : (
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: {
							xs: '1fr',
							sm: 'repeat(2, minmax(0, 1fr))',
							lg: 'repeat(3, minmax(0, 1fr))',
							xl: 'repeat(4, minmax(0, 1fr))',
						},
						gap: 2.5,
					}}
				>
					{teachers.length === 0 ? (
						<Box
							sx={{
								gridColumn: '1 / -1',
								border: '1px solid',
								borderColor: 'divider',
								borderRadius: 1,
								py: 8,
								textAlign: 'center',
								color: 'text.secondary',
							}}
						>
							No teachers yet.
						</Box>
					) : (
						teachers.map((teacher) => {
							const linked = teacherUsers.find((u) => u._id === teacher.userId);
							const bio = teacher.bio.length > 130 ? `${teacher.bio.substring(0, 130)}...` : teacher.bio;
							const courseCount = teacherCourseCounts[teacher._id];

							return (
								<Card
									key={teacher._id}
									elevation={0}
									sx={{
										position: 'relative',
										border: '1px solid',
										borderColor: 'divider',
										borderRadius: 1,
										height: '100%',
										transition: 'transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease',
										boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
										'&:hover': {
											transform: 'translateY(-4px)',
											borderColor: 'primary.light',
											boxShadow: '0 12px 28px rgba(15,23,42,0.10), 0 4px 10px rgba(15,23,42,0.06)',
										},
									}}
								>
									<Box sx={{ position: 'absolute', top: 10, right: 10 }}>
										<ItemActionMenu
											actions={[
												{
													label: 'View details',
													icon: <VisibilityOutlinedIcon fontSize='small' sx={{ mr: 1 }} />,
													onClick: () => void handleOpenDetails(teacher),
												},
												{
													label: 'Edit',
													icon: <EditOutlinedIcon fontSize='small' sx={{ mr: 1 }} />,
													onClick: () => handleOpenDialog(teacher),
												},
												{
													label: 'Delete',
													color: 'error',
													icon: <DeleteOutlinedIcon fontSize='small' sx={{ mr: 1 }} />,
													onClick: () => void handleDelete(teacher._id),
												},
											]}
										/>
									</Box>
									<CardContent
										sx={{
											p: 2.5,
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											textAlign: 'center',
											height: '100%',
										}}
									>
										<Avatar
											src={teacher.profileImage}
											alt={teacher.name}
											sx={{
												width: 96,
												height: 96,
												mb: 1.5,
												fontSize: 36,
												fontWeight: 800,
											}}
										>
											{teacher.name.charAt(0)}
										</Avatar>
										<Typography variant='h6' sx={{ fontWeight: 800, pr: 2, pl: 2 }}>
											{teacher.name}
										</Typography>
										<Typography
											variant='body2'
											color='text.secondary'
											sx={{ mt: 1, minHeight: 58, lineHeight: 1.55 }}
										>
											{bio}
										</Typography>

										<Box
											sx={{
												display: 'flex',
												flexWrap: 'wrap',
												justifyContent: 'center',
												gap: 0.75,
												mt: 2,
												minHeight: 28,
											}}
										>
											{teacher.expertise.slice(0, 3).map((exp, index) => (
												<Chip key={`${exp}-${index}`} label={exp} size='small' variant='outlined' />
											))}
											{teacher.expertise.length > 3 && (
												<Chip label={`+${teacher.expertise.length - 3}`} size='small' variant='outlined' />
											)}
										</Box>

										<Box sx={{ mt: 'auto', pt: 2.25, width: '100%' }}>
											<Box
												sx={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													gap: 1,
													borderTop: '1px solid',
													borderColor: 'divider',
													pt: 1.5,
													mb: 1.5,
												}}
											>
												<MenuBookIcon sx={{ fontSize: 18, color: 'primary.main' }} />
												<Typography variant='body2' sx={{ fontWeight: 800 }}>
													{courseCount == null
														? 'Loading courses...'
														: `${courseCount} course${courseCount !== 1 ? 's' : ''} teaching`}
												</Typography>
											</Box>
											{linked ? (
												<Box
													sx={{
														pt: 0.25,
													}}
												>
													<Typography variant='body2' sx={{ fontWeight: 700 }}>
														{linked.name}
													</Typography>
													<Typography
														variant='caption'
														color='text.secondary'
														sx={{ display: 'block', overflowWrap: 'anywhere' }}
													>
														{linked.email}
													</Typography>
													<Chip label={linked.role} size='small' color='primary' variant='outlined' sx={{ mt: 1 }} />
												</Box>
											) : (
												<Typography
													variant='body2'
													color='text.disabled'
													sx={{
														pt: 0.25,
													}}
												>
													Not linked
												</Typography>
											)}
										</Box>
									</CardContent>
								</Card>
							);
						})
					)}
				</Box>
			)}

			<TeacherDetailsModal
				open={detailsOpen}
				teacher={detailsTeacher}
				linkedUser={detailsTeacher ? teacherUsers.find((u) => u._id === detailsTeacher.userId) : undefined}
				courses={detailsCourses}
				loading={detailsLoading}
				onCourseOpen={(courseId) => {
					handleCloseDetails();
					navigate(`/admin/courses/${courseId}/learn`);
				}}
				onClose={handleCloseDetails}
			/>

			<AppModal
				open={dialogOpen}
				onClose={handleCloseDialog}
				title={editingTeacher ? 'Edit Teacher' : 'Add Teacher'}
				onSave={() => void handleSave()}
				saving={saving}
				maxWidth='md'
			>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
						<TextField
							label='Name'
							value={form.name}
							onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
							fullWidth
							required
						/>
						<TextField
							label='Bio'
							value={form.bio}
							onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
							fullWidth
							multiline
							rows={3}
							required
						/>
						<TextField
							label='Expertise (comma-separated)'
							value={form.expertise}
							onChange={(e) => setForm((p) => ({ ...p, expertise: e.target.value }))}
							fullWidth
							placeholder='e.g., Mathematics, Physics, Programming'
						/>
						<TextField
							label='Social Links (JSON)'
							value={form.socialLinks}
							onChange={(e) => setForm((p) => ({ ...p, socialLinks: e.target.value }))}
							fullWidth
							multiline
							rows={4}
							placeholder='{"linkedin": "url", "twitter": "url"}'
						/>
						<FormControl fullWidth>
							<InputLabel>Link to Teacher User Account</InputLabel>
							<Select
								label='Link to Teacher User Account'
								value={form.userId}
								onChange={(e) => {
									const selectedUser = teacherUsers.find((u) => u._id === e.target.value);
									setForm((p) => ({
										...p,
										userId: e.target.value,
										name: selectedUser ? selectedUser.name : p.name,
									}));
								}}
							>
								<MenuItem value=''>
									<em>None</em>
								</MenuItem>
								{getLinkableTeacherUsers().map((u) => (
									<MenuItem key={u._id} value={u._id}>
										{u.name} — {u.email} — {u.role}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<Paper
							variant='outlined'
							sx={{
								p: 2,
								borderRadius: 1,
								display: 'flex',
								alignItems: 'center',
								gap: 2,
								flexWrap: 'wrap',
							}}
						>
							<Avatar
								src={profilePreviewUrl}
								alt={form.name || 'Teacher profile preview'}
								sx={{ width: 88, height: 88, fontSize: 30, fontWeight: 900 }}
							>
								{form.name.trim().charAt(0).toUpperCase() || 'T'}
							</Avatar>
							<Box sx={{ flex: 1, minWidth: 220 }}>
								<Typography sx={{ fontWeight: 800 }}>Teacher profile image</Typography>
								<Typography variant='body2' color='text.secondary' sx={{ mb: 1.25 }}>
									Upload a clear square JPG, PNG, or WebP image. A new upload replaces the current profile image.
								</Typography>
								<Button
									variant='outlined'
									component='label'
									startIcon={<CloudUploadIcon />}
									sx={{ borderRadius: 0.5, fontWeight: 800 }}
								>
									{editingTeacher?.profileImage ? 'Replace Profile Image' : 'Upload Profile Image'}
									<input
										type='file'
										accept='image/*'
										hidden
										onChange={(event) => handleProfileImageSelect(event.target.files?.[0])}
									/>
								</Button>
								{form.profileImage && (
									<Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
										Selected: {form.profileImage.name} ({Math.round(form.profileImage.size / 1024)} KB)
									</Typography>
								)}
							</Box>
						</Paper>
					</Box>
			</AppModal>
		</Box>
	);
};

export default TeachersPage;

interface TeacherDetailsModalProps {
	open: boolean;
	teacher: ITeacher | null;
	linkedUser?: IUser;
	courses: ICourse[];
	loading: boolean;
	onCourseOpen: (courseId: string) => void;
	onClose: () => void;
}

const TeacherDetailsModal: FC<TeacherDetailsModalProps> = ({
	open,
	teacher,
	linkedUser,
	courses,
	loading,
	onCourseOpen,
	onClose,
}) => {
	const socialLinks = teacher?.socialLinks
		? Object.entries(teacher.socialLinks).filter((entry): entry is [string, string] => Boolean(entry[1]))
		: [];
	const joinedDate = teacher?.createdAt || linkedUser?.createdAt;

	return (
		<AppModal
			open={open}
			onClose={onClose}
			title='Teacher details'
			cancelText='Close'
			cancelButtonSx={{
				border: '1px solid',
				borderColor: 'error.main',
				color: 'error.main',
				borderRadius: 2,
				px: 2.5,
				fontWeight: 800,
				'&:hover': {
					borderColor: 'error.dark',
					bgcolor: 'error.50',
					color: 'error.dark',
				},
			}}
			maxWidth='lg'
			contentSx={{ p: 0 }}
		>
			{!teacher ? null : (
				<Box>
					<Box
						sx={{
							p: 3,
							display: 'grid',
							gridTemplateColumns: { xs: '1fr', md: '220px 1fr' },
							gap: 3,
						}}
					>
						<Box sx={{ textAlign: { xs: 'left', md: 'center' } }}>
							<Avatar
								src={teacher.profileImage}
								alt={teacher.name}
								sx={{
									width: 132,
									height: 132,
									fontSize: 48,
									fontWeight: 900,
									mx: { xs: 0, md: 'auto' },
									mb: 2,
								}}
							>
								{teacher.name.charAt(0)}
							</Avatar>
							<Chip label={linkedUser ? 'Linked account' : 'Not linked'} color={linkedUser ? 'primary' : 'default'} variant='outlined' />
						</Box>

						<Box sx={{ minWidth: 0 }}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
								<Box sx={{ minWidth: 0 }}>
									<Typography variant='h5' sx={{ fontWeight: 900 }}>
										{teacher.name}
									</Typography>
									{linkedUser?.email && (
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75, color: 'text.secondary' }}>
											<EmailOutlinedIcon sx={{ fontSize: 17 }} />
											<Typography variant='body2' sx={{ overflowWrap: 'anywhere' }}>
												{linkedUser.email}
											</Typography>
										</Box>
									)}
								</Box>
								<Paper variant='outlined' sx={{ px: 2, py: 1.25, borderRadius: 1, minWidth: 150 }}>
									<Typography variant='caption' color='text.secondary' sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
										Total courses
									</Typography>
									<Typography variant='h4' sx={{ fontWeight: 900, lineHeight: 1.1 }}>
										{courses.length}
									</Typography>
								</Paper>
							</Box>

							<Typography variant='body2' color='text.secondary' sx={{ mt: 2, lineHeight: 1.7 }}>
								{teacher.bio}
							</Typography>

							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5, mt: 2.5 }}>
								<InfoTile icon={<CalendarTodayIcon />} label='Joined' value={joinedDate ? formatDate(joinedDate) : 'Not available'} />
								<InfoTile icon={<MenuBookIcon />} label='Teaching' value={`${courses.length} assigned course${courses.length !== 1 ? 's' : ''}`} />
							</Box>

							{teacher.expertise.length > 0 && (
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 2.5 }}>
									{teacher.expertise.map((item, index) => (
										<Chip key={`${item}-${index}`} label={item} size='small' variant='outlined' />
									))}
								</Box>
							)}

							{socialLinks.length > 0 && (
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
									{socialLinks.map(([label, url]) => (
										<Button
											key={label}
											component='a'
											href={url}
											target='_blank'
											rel='noreferrer'
											size='small'
											variant='outlined'
											startIcon={<LinkIcon />}
											sx={{ textTransform: 'capitalize', fontWeight: 800 }}
										>
											{label}
										</Button>
									))}
								</Box>
							)}
						</Box>
					</Box>

					<Divider />

					<Box sx={{ p: 3 }}>
						<Typography variant='h6' sx={{ fontWeight: 900, mb: 2 }}>
							Assigned courses
						</Typography>

						{loading ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
								<CircularProgress />
							</Box>
						) : courses.length === 0 ? (
							<Paper variant='outlined' sx={{ p: 4, textAlign: 'center', color: 'text.secondary', borderRadius: 1 }}>
								No courses are assigned to this teacher yet.
							</Paper>
						) : (
							<Box sx={{ display: 'grid', gap: 1.25 }}>
								{courses.map((course) => (
									<Paper
										key={course._id}
										variant='outlined'
										sx={{
											p: 1.5,
											borderRadius: 1,
											display: 'grid',
											gridTemplateColumns: { xs: '1fr', sm: '72px 1fr auto' },
											gap: 1.5,
											alignItems: 'center',
											transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
											'&:hover': {
												borderColor: 'primary.light',
												boxShadow: '0 10px 24px rgba(15,23,42,0.08)',
											},
										}}
									>
										<Box
											sx={{
												width: 72,
												height: 52,
												borderRadius: 1,
												overflow: 'hidden',
												bgcolor: 'grey.100',
												display: { xs: 'none', sm: 'flex' },
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											{course.coverImage ? (
												<Box component='img' src={course.coverImage} alt={course.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
											) : (
												<MenuBookIcon color='primary' />
											)}
										</Box>
										<Box sx={{ minWidth: 0 }}>
											<Typography variant='subtitle2' sx={{ fontWeight: 900 }} noWrap>
												{course.title}
											</Typography>
											<Typography variant='caption' color='text.secondary' noWrap sx={{ display: 'block' }}>
												{course.courseType?.name || 'No course type'} · {course.category?.name || 'No category'}
											</Typography>
										</Box>
										<Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, alignItems: 'center' }}>
											<Chip label={course.status} size='small' color={course.status === 'Published' ? 'success' : 'default'} variant='outlined' />
											<Chip label={course.visibility} size='small' />
											<Chip
												label={`${course.enrollmentStats?.totalEnrollments ?? 0} student${(course.enrollmentStats?.totalEnrollments ?? 0) !== 1 ? 's' : ''}`}
												size='small'
												variant='outlined'
											/>
											<Button
												size='small'
												variant='contained'
												startIcon={<VisibilityOutlinedIcon />}
												onClick={() => onCourseOpen(course._id)}
												sx={{ fontWeight: 800 }}
											>
												View Course
											</Button>
										</Box>
									</Paper>
								))}
							</Box>
						)}
					</Box>
				</Box>
			)}
		</AppModal>
	);
};

interface InfoTileProps {
	icon: ReactNode;
	label: string;
	value: string;
}

const InfoTile: FC<InfoTileProps> = ({ icon, label, value }) => {
	return (
		<Paper variant='outlined' sx={{ p: 1.5, borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1.25 }}>
			<Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
			<Box sx={{ minWidth: 0 }}>
				<Typography variant='caption' color='text.secondary' sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
					{label}
				</Typography>
				<Typography variant='body2' sx={{ fontWeight: 800 }} noWrap>
					{value}
				</Typography>
			</Box>
		</Paper>
	);
};
