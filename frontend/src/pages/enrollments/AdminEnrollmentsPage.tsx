import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	Avatar,
	Box,
	Chip,
	CircularProgress,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Paper,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tabs,
	Tooltip,
	Typography,
} from '@mui/material';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import { enrollmentService } from '../../services/enrollment.service';
import { courseService } from '../../services/course.service';
import type { IEnrollment, IEnrollmentStats, EnrollmentType, ICourse } from '../../types/index';

type SidebarView = 'students' | 'revenue';
type FilterTab = 'all' | EnrollmentType;

const FILTER_TABS: { label: string; value: FilterTab }[] = [
	{ label: 'All', value: 'all' },
	{ label: 'Free', value: 'free' },
	{ label: 'Paid', value: 'paid' },
	{ label: 'Subscription', value: 'subscription' },
];

const TYPE_COLOR: Record<EnrollmentType, 'default' | 'success' | 'primary' | 'secondary'> = {
	free: 'success',
	paid: 'primary',
	subscription: 'secondary',
};

function StatPill({ label, value }: { label: string; value: string | number }) {
	return (
		<Box
			sx={{
				px: 2,
				py: 1,
				borderRadius: 2,
				border: '1px solid',
				borderColor: 'divider',
				textAlign: 'center',
				minWidth: 90,
			}}
		>
			<Typography variant='h6' sx={{ fontWeight: 700, lineHeight: 1.1 }}>
				{value}
			</Typography>
			<Typography variant='caption' color='text.secondary'>
				{label}
			</Typography>
		</Box>
	);
}

export default function AdminEnrollmentsPage() {
	const { courseId } = useParams<{ courseId: string }>();
	const navigate = useNavigate();

	const [course, setCourse] = useState<ICourse | null>(null);
	const [stats, setStats] = useState<IEnrollmentStats | null>(null);
	const [enrollments, setEnrollments] = useState<IEnrollment[]>([]);
	const [view, setView] = useState<SidebarView>('students');
	const [filterTab, setFilterTab] = useState<FilterTab>('all');
	const [loading, setLoading] = useState(true);
	const [tabLoading, setTabLoading] = useState(false);

	useEffect(() => {
		if (!courseId) return;
		Promise.all([
			courseService.getById(courseId),
			enrollmentService.getCourseStats(courseId),
			enrollmentService.getCourseEnrollments(courseId),
		]).then(([courseRes, statsRes, enrollRes]) => {
			setCourse(courseRes.data ?? null);
			setStats(statsRes.data ?? null);
			setEnrollments(enrollRes.data ?? []);
		}).finally(() => setLoading(false));
	}, [courseId]);

	const handleFilterTab = (_: React.SyntheticEvent, val: FilterTab) => {
		setFilterTab(val);
		if (!courseId) return;
		setTabLoading(true);
		enrollmentService
			.getCourseEnrollments(courseId, val)
			.then((res) => setEnrollments(res.data ?? []))
			.finally(() => setTabLoading(false));
	};

	const handleViewChange = (newView: SidebarView) => {
		setView(newView);
		// Reset filter when switching to students view
		if (newView === 'students' && filterTab !== 'all') {
			setFilterTab('all');
			if (courseId) {
				setTabLoading(true);
				enrollmentService
					.getCourseEnrollments(courseId)
					.then((res) => setEnrollments(res.data ?? []))
					.finally(() => setTabLoading(false));
			}
		}
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
				<CircularProgress />
			</Box>
		);
	}

	const paidEnrollments = enrollments.filter((e) => e.enrollmentType === 'paid');
	const totalRevenue = paidEnrollments.reduce(
		(sum, e) => sum + (e.course?.price ?? 0),
		0,
	);

	return (
		<Box sx={{ display: 'flex', gap: 0, height: '100%', minHeight: 0 }}>
			{/* ── Sidebar ── */}
			<Paper
				elevation={0}
				sx={{
					width: 200,
					flexShrink: 0,
					borderRight: '1px solid',
					borderColor: 'divider',
					borderRadius: 0,
					display: 'flex',
					flexDirection: 'column',
					pt: 1,
				}}
			>
				{/* Back */}
				<Tooltip title='Back to courses'>
					<ListItemButton
						onClick={() => navigate('/admin/courses')}
						sx={{ mb: 1, borderRadius: 2, mx: 1 }}
					>
						<ListItemIcon sx={{ minWidth: 32 }}>
							<ArrowBackIosNewIcon fontSize='small' />
						</ListItemIcon>
						<ListItemText primary={<Typography variant='body2' sx={{ fontWeight: 600 }}>Courses</Typography>} />
					</ListItemButton>
				</Tooltip>

				<Typography
					variant='caption'
					sx={{ px: 2, mb: 0.5, color: 'text.secondary', fontWeight: 700, letterSpacing: 0.5 }}
				>
					VIEW
				</Typography>

				<List disablePadding sx={{ px: 1 }}>
					<ListItemButton
						selected={view === 'students'}
						onClick={() => handleViewChange('students')}
						sx={{ borderRadius: 2, mb: 0.5 }}
					>
						<ListItemIcon sx={{ minWidth: 36 }}>
							<PeopleAltOutlinedIcon fontSize='small' />
						</ListItemIcon>
						<ListItemText primary={<Typography variant='body2' sx={{ fontWeight: 600 }}>Students</Typography>} />
					</ListItemButton>

					<ListItemButton
						selected={view === 'revenue'}
						onClick={() => handleViewChange('revenue')}
						sx={{ borderRadius: 2 }}
					>
						<ListItemIcon sx={{ minWidth: 36 }}>
							<MonetizationOnOutlinedIcon fontSize='small' />
						</ListItemIcon>
						<ListItemText primary={<Typography variant='body2' sx={{ fontWeight: 600 }}>Revenue</Typography>} />
					</ListItemButton>
				</List>
			</Paper>

			{/* ── Main content ── */}
			<Box sx={{ flex: 1, minWidth: 0, px: 3, py: 2, overflowY: 'auto' }}>
				{/* Course header */}
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
					<Box
						sx={{
							width: 56,
							height: 40,
							borderRadius: 1.5,
							overflow: 'hidden',
							flexShrink: 0,
							bgcolor: 'grey.200',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						{course?.coverImage ? (
							<Box
								component='img'
								src={course.coverImage}
								alt={course.title}
								sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
							/>
						) : (
							<SchoolOutlinedIcon sx={{ color: 'grey.400', fontSize: 20 }} />
						)}
					</Box>
					<Box>
						<Typography variant='h5' sx={{ fontWeight: 700, lineHeight: 1.2 }}>
							{course?.title ?? '—'}
						</Typography>
						<Typography variant='caption' color='text.secondary'>
							{course?.pricing === 'Free'
								? 'Free course'
								: course?.price != null
									? `$${course.price.toFixed(2)}`
									: 'Paid course'}
							{' · '}
							{course?.status}
						</Typography>
					</Box>
				</Box>

				{/* Stats strip */}
				{stats && (
					<Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
						<StatPill label='Total enrolled' value={stats.total} />
						<StatPill label='Free' value={stats.free} />
						<StatPill label='Paid' value={stats.paid} />
						<StatPill label='Subscription' value={stats.subscription} />
						<StatPill label='This month' value={stats.thisMonthCount} />
						<StatPill label='Earned / month' value={`$${stats.thisMonthEarned.toFixed(2)}`} />
					</Box>
				)}

				{/* ── STUDENTS VIEW ── */}
				{view === 'students' && (
					<>
						<Typography variant='h6' sx={{ fontWeight: 700, mb: 1.5 }}>
							Enrolled Students
						</Typography>
						<Paper
							elevation={0}
							sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
						>
							<Tabs
								value={filterTab}
								onChange={handleFilterTab}
								sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}
								textColor='primary'
								indicatorColor='primary'
							>
								{FILTER_TABS.map((t) => (
									<Tab key={t.value} label={t.label} value={t.value} />
								))}
							</Tabs>

							{tabLoading ? (
								<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
									<CircularProgress size={28} />
								</Box>
							) : enrollments.length === 0 ? (
								<Box sx={{ py: 6, textAlign: 'center' }}>
									<Typography color='text.secondary'>No students found.</Typography>
								</Box>
							) : (
								<TableContainer>
									<Table size='small'>
										<TableHead>
											<TableRow>
												<TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
												<TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
												<TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
												<TableCell sx={{ fontWeight: 700 }}>Enrolled On</TableCell>
												<TableCell sx={{ fontWeight: 700 }}>Enrollment ID</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{enrollments.map((e) => (
												<TableRow key={e._id} hover>
													<TableCell>
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
															<Avatar src={e.student.avatar} sx={{ width: 32, height: 32, fontSize: 13 }}>
																{e.student.name?.[0]}
															</Avatar>
															<Typography variant='body2' sx={{ fontWeight: 600 }}>
																{e.student.name}
															</Typography>
														</Box>
													</TableCell>
													<TableCell>
														<Typography variant='body2' color='text.secondary'>
															{e.student.email}
														</Typography>
													</TableCell>
													<TableCell>
														<Chip
															label={e.enrollmentType}
															color={TYPE_COLOR[e.enrollmentType]}
															size='small'
															sx={{ textTransform: 'capitalize', fontWeight: 600 }}
														/>
													</TableCell>
													<TableCell>
														<Typography variant='body2' color='text.secondary'>
															{new Date(e.createdAt).toLocaleDateString()}
														</Typography>
													</TableCell>
													<TableCell>
														<Typography
															variant='caption'
															sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
														>
															{e._id}
														</Typography>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							)}
						</Paper>
					</>
				)}

				{/* ── REVENUE VIEW ── */}
				{view === 'revenue' && (
					<>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
							<Typography variant='h6' sx={{ fontWeight: 700 }}>
								Revenue
							</Typography>
							<Typography variant='body2' sx={{ fontWeight: 700, color: '#10b981' }}>
								Total: ${totalRevenue.toFixed(2)}
							</Typography>
						</Box>
						<Paper
							elevation={0}
							sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
						>
							{paidEnrollments.length === 0 ? (
								<Box sx={{ py: 6, textAlign: 'center' }}>
									<Typography color='text.secondary'>No paid enrollments for this course.</Typography>
								</Box>
							) : (
								<TableContainer>
									<Table size='small'>
										<TableHead>
											<TableRow>
												<TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
												<TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
												<TableCell sx={{ fontWeight: 700 }}>Amount Paid</TableCell>
												<TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
												<TableCell sx={{ fontWeight: 700 }}>Enrollment ID</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{paidEnrollments.map((e) => (
												<TableRow key={e._id} hover>
													<TableCell>
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
															<Avatar src={e.student.avatar} sx={{ width: 32, height: 32, fontSize: 13 }}>
																{e.student.name?.[0]}
															</Avatar>
															<Typography variant='body2' sx={{ fontWeight: 600 }}>
																{e.student.name}
															</Typography>
														</Box>
													</TableCell>
													<TableCell>
														<Typography variant='body2' color='text.secondary'>
															{e.student.email}
														</Typography>
													</TableCell>
													<TableCell>
														<Typography variant='body2' sx={{ fontWeight: 700, color: '#10b981' }}>
															${e.course?.price?.toFixed(2) ?? '0.00'}
														</Typography>
													</TableCell>
													<TableCell>
														<Typography variant='body2' color='text.secondary'>
															{new Date(e.createdAt).toLocaleDateString()}
														</Typography>
													</TableCell>
													<TableCell>
														<Typography
															variant='caption'
															sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
														>
															{e._id}
														</Typography>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							)}
						</Paper>
					</>
				)}
			</Box>
		</Box>
	);
}
