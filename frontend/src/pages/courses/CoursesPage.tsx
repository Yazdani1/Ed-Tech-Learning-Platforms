import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
	IconButton,
	InputAdornment,
	Paper,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import toast from 'react-hot-toast';
import { courseService } from '../../services/course.service';
import CourseCard from '../../components/ui/CourseCard';
import type { ICourse } from '../../types/index';
import { useAuth } from '../../context/useAuth';

const ADMIN_ROLES = ['Super Admin', 'Admin', 'Moderator'] as const;

export default function CoursesPage() {
	const { user, isLoading: authLoading } = useAuth();
	const navigate = useNavigate();
	const [courses, setCourses] = useState<ICourse[]>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [removeTarget, setRemoveTarget] = useState<ICourse | null>(null);
	const [removing, setRemoving] = useState(false);
	const abortRef = useRef<AbortController | null>(null);

	const isAdmin = user && (ADMIN_ROLES as readonly string[]).includes(user.role);
	const isStudent = user?.role === 'Student';

	useEffect(() => {
		if (authLoading) return;
		abortRef.current?.abort();
		abortRef.current = new AbortController();
		setLoading(true);

		const load = isStudent
			? courseService.getEnrolled()
			: courseService.getAll(search ? { search } : {});

		load
			.then((res) => {
				const data = res.data;
				const valid = Array.isArray(data)
					? data.filter((c): c is ICourse => Boolean(c && (c as ICourse)._id))
					: [];
				setCourses(valid);
			})
			.catch(() => {})
			.finally(() => setLoading(false));

		return () => { abortRef.current?.abort(); };
	}, [search, isStudent, authLoading]);

	const handleConfirmRemove = async () => {
		if (!removeTarget) return;
		setRemoving(true);
		try {
			await courseService.unenroll(removeTarget._id);
			setCourses((prev) => prev.filter((c) => c._id !== removeTarget._id));
			toast.success(`Removed from "${removeTarget.title}"`);
		} catch {
			toast.error('Failed to remove course');
		} finally {
			setRemoving(false);
			setRemoveTarget(null);
		}
	};

	// Student: filter client-side by search, split by enrollmentType
	const filtered = isStudent && search
		? courses.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
		: courses;

	const directCourses = filtered.filter((c) => c.enrollmentType !== 'subscription');
	const subCourses = filtered.filter((c) => c.enrollmentType === 'subscription');

	return (
		<Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
				<Typography variant='h4' sx={{ fontWeight: 700 }}>
					{isStudent ? 'My Courses' : 'Courses'}
				</Typography>
				{isAdmin && (
					<Button
						variant='contained'
						startIcon={<AddIcon />}
						onClick={() => navigate('/admin/courses/create')}
					>
						Create Course
					</Button>
				)}
			</Box>

			<TextField
				placeholder='Search courses...'
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				size='small'
				sx={{ mb: 3, maxWidth: 360 }}
				slotProps={{
					input: {
						startAdornment: (
							<InputAdornment position='start'>
								<SearchIcon />
							</InputAdornment>
						),
					},
				}}
			/>

			{loading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
					<CircularProgress />
				</Box>
			) : isStudent ? (
				/* ── Student: two labelled sections ─────────────── */
				<>
					{/* Section 1: Free & Paid courses */}
					<Box sx={{ mb: 5 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
							<Typography variant='h6' sx={{ fontWeight: 700 }}>
								Free &amp; Paid Courses
							</Typography>
							<Chip label={directCourses.length} size='small' color='primary' />
						</Box>

						{directCourses.length === 0 ? (
							<Typography variant='body2' color='text.secondary'>
								No free or paid courses enrolled yet.
							</Typography>
						) : (
							<Grid container spacing={3}>
								{directCourses.map((course) => (
									<Grid key={course._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
										<CourseCardWithRemove
											course={course}
											onRemove={() => setRemoveTarget(course)}
										/>
									</Grid>
								))}
							</Grid>
						)}
					</Box>

					{/* Section 2: Subscription courses */}
					<Box>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
							<CardMembershipIcon sx={{ color: '#7c3aed', fontSize: 22 }} />
							<Typography variant='h6' sx={{ fontWeight: 700 }}>
								Enrolled with Subscription
							</Typography>
							<Chip label={subCourses.length} size='small' sx={{ bgcolor: '#7c3aed', color: 'white' }} />
						</Box>

						{subCourses.length === 0 ? (
							<Typography variant='body2' color='text.secondary'>
								No subscription courses enrolled yet.
							</Typography>
						) : (
							<Grid container spacing={3}>
								{subCourses.map((course) => (
									<Grid key={course._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
										<CourseCardWithRemove
											course={course}
											onRemove={() => setRemoveTarget(course)}
											subscriptionBadge
										/>
									</Grid>
								))}
							</Grid>
						)}
					</Box>

					{filtered.length === 0 && search && (
						<Typography color='text.secondary' sx={{ mt: 4, textAlign: 'center' }}>
							No courses match &quot;{search}&quot;.
						</Typography>
					)}
					{courses.length === 0 && !search && (
						<Typography color='text.secondary' sx={{ mt: 4, textAlign: 'center' }}>
							You haven&apos;t enrolled in any courses yet.
						</Typography>
					)}
				</>
			) : (
				/* ── Admin: list rows ────────────────────────────── */
				courses.length === 0 ? (
					<Typography color='text.secondary' sx={{ textAlign: 'center', mt: 8 }}>
						No courses found.
					</Typography>
				) : (
					<Paper variant='outlined' sx={{ borderRadius: 2, overflow: 'hidden' }}>
						{courses.map((course, idx) => (
							<AdminCourseRow
								key={course._id}
								course={course}
								divider={idx < courses.length - 1}
								onEdit={() => navigate(`/admin/courses/${course._id}/edit`)}
							/>
						))}
					</Paper>
				)
			)}

			{/* Remove confirmation dialog */}
			<Dialog open={Boolean(removeTarget)} onClose={() => setRemoveTarget(null)} maxWidth='xs' fullWidth>
				<DialogTitle>Remove Course</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to remove{' '}
						<strong>&quot;{removeTarget?.title}&quot;</strong> from your courses?
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setRemoveTarget(null)} disabled={removing}>
						Keep It
					</Button>
					<Button
						variant='contained'
						color='error'
						disabled={removing}
						onClick={() => void handleConfirmRemove()}
					>
						{removing ? <CircularProgress size={18} color='inherit' /> : 'Remove'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}

// ── Thin wrapper: CourseCard + remove button ─────────────────
function CourseCardWithRemove({
	course,
	onRemove,
	subscriptionBadge = false,
}: {
	course: ICourse;
	onRemove: () => void;
	subscriptionBadge?: boolean;
}) {
	return (
		<Box sx={{ position: 'relative' }}>
			<CourseCard course={course} basePath='/courses' />
			{subscriptionBadge && (
				<Box
					sx={{
						position: 'absolute',
						top: 8,
						left: 8,
						bgcolor: '#7c3aed',
						color: 'white',
						borderRadius: 1,
						px: 0.75,
						py: 0.25,
						display: 'flex',
						alignItems: 'center',
						gap: 0.4,
						pointerEvents: 'none',
					}}
				>
					<CardMembershipIcon sx={{ fontSize: 12 }} />
					<Typography sx={{ fontSize: '0.65rem', fontWeight: 700, lineHeight: 1 }}>
						Subscription
					</Typography>
				</Box>
			)}
			<Tooltip title='Remove from my courses'>
				<IconButton
					size='small'
					onClick={onRemove}
					sx={{
						position: 'absolute',
						top: 6,
						right: 6,
						bgcolor: 'rgba(255,255,255,0.9)',
						'&:hover': { bgcolor: 'error.light', color: 'white' },
					}}
				>
					<DeleteOutlineIcon fontSize='small' />
				</IconButton>
			</Tooltip>
		</Box>
	);
}

// ── Admin course list row ─────────────────────────────────────
function AdminCourseRow({
	course,
	divider,
	onEdit,
}: {
	course: ICourse;
	divider: boolean;
	onEdit: () => void;
}) {
	const navigate = useNavigate();
	const isLive = course.status === 'Published';
	const priceLabel =
		course.pricing === 'Free'
			? 'Free'
			: course.price != null
				? `$${course.price.toFixed(2)}`
				: 'Paid';

	return (
		<>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 2.5,
					px: 2.5,
					py: 2,
					transition: 'background 0.15s',
					'&:hover': { bgcolor: 'action.hover' },
				}}
			>
				{/* Thumbnail */}
				<Box
					sx={{
						width: 96,
						height: 64,
						borderRadius: 1,
						overflow: 'hidden',
						flexShrink: 0,
						bgcolor: 'grey.200',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					{course.coverImage ? (
						<Box
							component='img'
							src={course.coverImage}
							alt={course.title}
							sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
						/>
					) : (
						<SchoolOutlinedIcon sx={{ color: 'grey.400', fontSize: 28 }} />
					)}
				</Box>

				{/* Title + meta */}
				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Typography
						sx={{
							fontWeight: 700,
							fontSize: '0.95rem',
							mb: 0.5,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
						}}
					>
						{course.title}
					</Typography>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
						<Chip
							label={isLive ? 'LIVE' : 'DRAFT'}
							size='small'
							sx={{
								height: 20,
								fontSize: '0.65rem',
								fontWeight: 700,
								bgcolor: isLive ? '#1a1a2e' : '#6b7280',
								color: 'white',
								borderRadius: 0.75,
							}}
						/>
						<Typography variant='caption' color='text.secondary'>
							{priceLabel} &middot; {course.visibility}
						</Typography>
						{course.includedInSubscription && course.allowedSubscriptionPlans.length > 0 && (
							<Typography variant='caption' sx={{ color: '#7c3aed', fontWeight: 600 }}>
								{course.allowedSubscriptionPlans.join(', ')}
							</Typography>
						)}
					</Box>
				</Box>

				{/* Earned this month */}
				<Box
					onClick={() => navigate(`/admin/enrollments/${course._id}`)}
					sx={{
						textAlign: 'center',
						minWidth: 130,
						display: { xs: 'none', md: 'block' },
						cursor: 'pointer',
						borderRadius: 2,
						px: 1,
						py: 0.5,
						'&:hover': { bgcolor: 'action.hover' },
					}}
				>
					<Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>$0.00</Typography>
					<Typography variant='caption' color='text.secondary'>
						Earned this month
					</Typography>
				</Box>

				{/* Enrollments this month */}
				<Box
					onClick={() => navigate(`/admin/enrollments/${course._id}`)}
					sx={{
						textAlign: 'center',
						minWidth: 130,
						display: { xs: 'none', md: 'block' },
						cursor: 'pointer',
						borderRadius: 2,
						px: 1,
						py: 0.5,
						'&:hover': { bgcolor: 'action.hover' },
					}}
				>
					<Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>0</Typography>
					<Typography variant='caption' color='text.secondary'>
						Enrollments this month
					</Typography>
				</Box>

				{/* Edit button */}
				<Tooltip title='Edit course'>
					<IconButton onClick={onEdit} size='small' sx={{ flexShrink: 0 }}>
						<EditOutlinedIcon fontSize='small' />
					</IconButton>
				</Tooltip>
			</Box>
			{divider && <Divider />}
		</>
	);
}
