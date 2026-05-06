import { useEffect, useState } from 'react';
import {
	Avatar,
	Box,
	Chip,
	CircularProgress,
	Divider,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import PersonIcon from '@mui/icons-material/Person';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import SubscriptionsOutlinedIcon from '@mui/icons-material/SubscriptionsOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip as ReTooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { useAuth } from '../../context/useAuth';
import { dashboardService } from '../../services/dashboard.service';
import { formatDateTime } from '../../utils/dateTime';
import type { IDashboardSummary } from '../../types/index';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#ef4444'];

const formatCurrency = (amount: number) =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(amount);

function StatCard({
	label,
	value,
	helper,
	icon,
}: {
	label: string;
	value: string | number;
	helper?: string;
	icon: React.ReactNode;
}) {
	return (
		<Paper
			elevation={0}
			sx={{
				p: 2.25,
				borderRadius: 1,
				border: '1px solid',
				borderColor: 'divider',
				display: 'flex',
				gap: 1.5,
				alignItems: 'flex-start',
				minHeight: 116,
			}}
		>
			<Box
				sx={{
					width: 42,
					height: 42,
					borderRadius: 1,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					bgcolor: 'grey.100',
					color: 'primary.main',
					flexShrink: 0,
				}}
			>
				{icon}
			</Box>
			<Box sx={{ minWidth: 0 }}>
				<Typography variant='h5' sx={{ fontWeight: 900, lineHeight: 1.1 }}>
					{value}
				</Typography>
				<Typography variant='body2' sx={{ fontWeight: 750, mt: 0.75 }}>
					{label}
				</Typography>
				{helper && (
					<Typography variant='caption' color='text.secondary'>
						{helper}
					</Typography>
				)}
			</Box>
		</Paper>
	);
}

function ChartCard({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<Paper
			elevation={0}
			sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
		>
			<Typography variant='h6' sx={{ fontWeight: 850, mb: 2 }}>
				{title}
			</Typography>
			<Box sx={{ height: 300 }}>{children}</Box>
		</Paper>
	);
}

export default function DashboardPage() {
	const { user } = useAuth();
	const [summary, setSummary] = useState<IDashboardSummary | null>(null);
	const [loading, setLoading] = useState(user?.role !== 'Student');

	useEffect(() => {
		if (!user || user.role === 'Student') return;
		setLoading(true);
		dashboardService
			.getSummary()
			.then((res) => setSummary(res.data ?? null))
			.finally(() => setLoading(false));
	}, [user]);

	if (user?.role === 'Student') {
		return (
			<Box>
				<Typography variant='h4' sx={{ fontWeight: 800, mb: 1 }}>
					Dashboard
				</Typography>
				<Typography variant='body1' color='text.secondary'>
					Welcome back, {user.name}. Continue your courses from the course page.
				</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ pb: 3 }}>
			<Box sx={{ mb: 3 }}>
				<Typography variant='h4' sx={{ fontWeight: 900, mb: 0.75 }}>
					Dashboard
				</Typography>
				<Typography variant='body1' color='text.secondary'>
					Welcome back, {user?.name}. Here is the current application snapshot.
				</Typography>
			</Box>

			{loading || !summary ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
					<CircularProgress />
				</Box>
			) : (
				<>
					<Box
						sx={{
							display: 'grid',
							gap: 2,
							gridTemplateColumns: {
								xs: '1fr',
								sm: 'repeat(2, minmax(0, 1fr))',
								lg: 'repeat(4, minmax(0, 1fr))',
							},
							mb: 3,
						}}
					>
						<StatCard
							label='Total Revenue'
							value={formatCurrency(summary.totals.totalRevenue)}
							helper={`${formatCurrency(summary.totals.thisMonthRevenue)} this month`}
							icon={<PaidOutlinedIcon />}
						/>
						<StatCard
							label='Students'
							value={summary.totals.students}
							helper={`${summary.totals.thisMonthEnrollments} enrollments this month`}
							icon={<PeopleIcon />}
						/>
						<StatCard
							label='Courses'
							value={summary.totals.courses}
							helper={`${summary.totals.publishedCourses} published, ${summary.totals.draftCourses} draft`}
							icon={<SchoolIcon />}
						/>
						<StatCard
							label='Active Subscriptions'
							value={summary.totals.activeSubscriptions}
							helper={`${formatCurrency(summary.totals.subscriptionRevenue)} subscription revenue`}
							icon={<SubscriptionsOutlinedIcon />}
						/>
						<StatCard
							label='Teachers'
							value={summary.totals.teachers}
							helper='Instructor profiles'
							icon={<PersonIcon />}
						/>
						<StatCard
							label='Categories'
							value={summary.totals.categories}
							helper='Course organization'
							icon={<CategoryIcon />}
						/>
						<StatCard
							label='Open Questions'
							value={summary.totals.openQuestions}
							helper='Unresolved Q&A'
							icon={<QuestionAnswerOutlinedIcon />}
						/>
						<StatCard
							label='Course Revenue'
							value={formatCurrency(summary.totals.courseRevenue)}
							helper={`${summary.totals.enrollments} total enrollments`}
							icon={<TrendingUpOutlinedIcon />}
						/>
					</Box>

					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 2fr) minmax(320px, 1fr)' },
							gap: 2,
							mb: 3,
						}}
					>
						<ChartCard title='Revenue And Enrollments, Last 30 Days'>
							<ResponsiveContainer width='100%' height='100%'>
								<AreaChart data={summary.revenueTimeline}>
									<CartesianGrid strokeDasharray='3 3' vertical={false} />
									<XAxis dataKey='date' tick={{ fontSize: 12 }} />
									<YAxis yAxisId='left' tick={{ fontSize: 12 }} />
									<YAxis yAxisId='right' orientation='right' tick={{ fontSize: 12 }} />
									<ReTooltip formatter={(value, name) => name === 'enrollments' ? value : formatCurrency(Number(value))} />
									<Legend />
									<Area
										yAxisId='left'
										type='monotone'
										dataKey='totalRevenue'
										name='Revenue'
										stroke='#2563eb'
										fill='#bfdbfe'
									/>
									<Area
										yAxisId='right'
										type='monotone'
										dataKey='enrollments'
										name='Enrollments'
										stroke='#16a34a'
										fill='#bbf7d0'
									/>
								</AreaChart>
							</ResponsiveContainer>
						</ChartCard>

						<ChartCard title='Users By Role'>
							<ResponsiveContainer width='100%' height='100%'>
								<PieChart>
									<Pie
										data={summary.roleCounts}
										dataKey='value'
										nameKey='label'
										outerRadius={96}
										label
									>
										{summary.roleCounts.map((entry, index) => (
											<Cell key={entry.label} fill={COLORS[index % COLORS.length]} />
										))}
									</Pie>
									<ReTooltip />
									<Legend />
								</PieChart>
							</ResponsiveContainer>
						</ChartCard>
					</Box>

					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
							gap: 2,
							mb: 3,
						}}
					>
						<ChartCard title='Course Status'>
							<ResponsiveContainer width='100%' height='100%'>
								<BarChart data={summary.courseStatusCounts}>
									<CartesianGrid strokeDasharray='3 3' vertical={false} />
									<XAxis dataKey='label' />
									<YAxis allowDecimals={false} />
									<ReTooltip />
									<Bar dataKey='value' name='Courses' fill='#2563eb' radius={[4, 4, 0, 0]} />
								</BarChart>
							</ResponsiveContainer>
						</ChartCard>

						<ChartCard title='Course Pricing'>
							<ResponsiveContainer width='100%' height='100%'>
								<BarChart data={summary.coursePricingCounts}>
									<CartesianGrid strokeDasharray='3 3' vertical={false} />
									<XAxis dataKey='label' />
									<YAxis allowDecimals={false} />
									<ReTooltip />
									<Bar dataKey='value' name='Courses' fill='#16a34a' radius={[4, 4, 0, 0]} />
								</BarChart>
							</ResponsiveContainer>
						</ChartCard>
					</Box>

					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(0, 1fr)' },
							gap: 2,
						}}
					>
						<Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
							<Box sx={{ p: 2.5 }}>
								<Typography variant='h6' sx={{ fontWeight: 850 }}>
									Top Courses
								</Typography>
							</Box>
							<Divider />
							<Box sx={{ display: 'flex', flexDirection: 'column' }}>
								{summary.topCourses.length === 0 ? (
									<Typography sx={{ p: 2.5 }} color='text.secondary'>
										No enrollments yet.
									</Typography>
								) : (
									summary.topCourses.map((item) => (
										<Box
											key={item.course?._id ?? item.enrollments}
											sx={{
												display: 'flex',
												alignItems: 'center',
												gap: 1.5,
												p: 2,
												borderTop: '1px solid',
												borderColor: 'divider',
											}}
										>
											<Avatar
												src={item.course?.coverImage}
												variant='rounded'
												sx={{ width: 48, height: 48, bgcolor: 'grey.200' }}
											>
												<SchoolIcon />
											</Avatar>
											<Box sx={{ minWidth: 0, flex: 1 }}>
												<Typography sx={{ fontWeight: 800 }} noWrap>
													{item.course?.title ?? 'Deleted course'}
												</Typography>
												<Typography variant='caption' color='text.secondary'>
													{item.enrollments} enrollments
												</Typography>
											</Box>
											{item.course?.status && (
												<Chip label={item.course.status} size='small' variant='outlined' />
											)}
										</Box>
									))
								)}
							</Box>
						</Paper>

						<Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
							<Box sx={{ p: 2.5 }}>
								<Typography variant='h6' sx={{ fontWeight: 850 }}>
									Recent Enrollments
								</Typography>
							</Box>
							<TableContainer>
								<Table size='small'>
									<TableHead>
										<TableRow>
											<TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
											<TableCell sx={{ fontWeight: 800 }}>Course</TableCell>
											<TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
											<TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{summary.recentEnrollments.map((enrollment) => (
											<TableRow key={enrollment._id} hover>
												<TableCell>{enrollment.student?.name ?? '-'}</TableCell>
												<TableCell>{enrollment.course?.title ?? '-'}</TableCell>
												<TableCell>
													<Chip
														label={enrollment.enrollmentType}
														size='small'
														sx={{ textTransform: 'capitalize', fontWeight: 750 }}
													/>
												</TableCell>
												<TableCell>{formatDateTime(enrollment.createdAt)}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						</Paper>
					</Box>
				</>
			)}
		</Box>
	);
}
