import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Box,
	Button,
	ButtonGroup,
	CircularProgress,
	Divider,
	Drawer,
	IconButton,
	MenuItem,
	Paper,
	Radio,
	Select,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import {
	LineChart,
	Line,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip as ReTooltip,
	ResponsiveContainer,
	Legend,
} from 'recharts';
import { performanceService } from '../../services/performance.service';
import { useAuth } from '../../context/useAuth';
import type { ICourse, IPerformanceData, DateRange } from '../../types/index';

type ChartType = 'line' | 'bar' | 'pie';
type ChartMetric = 'revenue' | 'enrollments';

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
	{ label: 'Last 7 days', value: '7d' },
	{ label: 'Last 30 days', value: '30d' },
	{ label: 'Lifetime', value: 'lifetime' },
];

const PIE_COLORS = ['#22c55e', '#3b82f6', '#7c3aed'];

function StatCard({
	top,
	topSub,
	label,
	underline,
}: {
	top: string;
	topSub?: string;
	label: string;
	underline?: boolean;
}) {
	return (
		<Box sx={{ minWidth: 180 }}>
			<Typography variant='h4' sx={{ fontWeight: 700 }}>
				{top}
			</Typography>
			{topSub && (
				<Typography
					variant='caption'
					sx={{
						color: underline ? 'primary.main' : 'text.secondary',
						textDecoration: underline ? 'underline' : 'none',
						cursor: underline ? 'pointer' : 'default',
						fontWeight: 500,
						display: 'block',
					}}
				>
					{topSub}
				</Typography>
			)}
			<Typography
				variant='caption'
				sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}
			>
				{label}
			</Typography>
		</Box>
	);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtTooltip = (metric: ChartMetric) => (v: any) =>
	metric === 'revenue' ? `$${Number(v).toFixed(2)}` : String(v);

export default function PerformancePage() {
	const { user } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (user && user.role !== 'Super Admin')
			navigate('/admin/courses', { replace: true });
	}, [user, navigate]);

	const [data, setData] = useState<IPerformanceData | null>(null);
	const [courses, setCourses] = useState<ICourse[]>([]);
	const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
	const [selectedCourse, setSelectedCourse] = useState<ICourse | null>(null);
	const [dateRange, setDateRange] = useState<DateRange>('30d');
	const [chartType, setChartType] = useState<ChartType>('line');
	const [metric, setMetric] = useState<ChartMetric>('revenue');
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [courseSearch, setCourseSearch] = useState('');
	const [categoryFilter, setCategoryFilter] = useState<string>('all');
	const [loading, setLoading] = useState(true);
	const abortRef = useRef<AbortController | null>(null);

	useEffect(() => {
		performanceService.getCourses().then((res) => setCourses(res.data ?? []));
	}, []);

	useEffect(() => {
		abortRef.current?.abort();
		const ctrl = new AbortController();
		abortRef.current = ctrl;

		// defer to avoid synchronous setState-in-effect lint rule
		const t = setTimeout(() => {
			if (!ctrl.signal.aborted) setLoading(true);
		}, 0);

		performanceService
			.getOverview(selectedCourseId, dateRange)
			.then((res) => {
				if (!ctrl.signal.aborted) setData(res.data ?? null);
			})
			.finally(() => {
				clearTimeout(t);
				if (!ctrl.signal.aborted) setLoading(false);
			});

		return () => {
			clearTimeout(t);
			ctrl.abort();
		};
	}, [selectedCourseId, dateRange]);

	// unique categories from loaded courses
	const categories = Array.from(
		new Set(
			courses
				.map((c) => (c.category as unknown as { name: string })?.name)
				.filter(Boolean),
		),
	);

	const filteredCourses = courses.filter((c) => {
		const matchesSearch = c.title
			.toLowerCase()
			.includes(courseSearch.toLowerCase());
		const matchesCategory =
			categoryFilter === 'all' ||
			(c.category as unknown as { name: string })?.name === categoryFilter;
		return matchesSearch && matchesCategory;
	});

	const handleCourseSelect = (id: string, course: ICourse | null) => {
		setSelectedCourseId(id);
		setSelectedCourse(course);
		setDrawerOpen(false);
		setCourseSearch('');
		setCategoryFilter('all');
	};

	if (user && user.role !== 'Super Admin') return null;

	const courseLabel = selectedCourse ? selectedCourse.title : 'All courses';
	const tooltipFmt = fmtTooltip(metric);

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
			{/* Header */}
			<Box sx={{ mb: 3 }}>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 1,
						flexWrap: 'wrap',
					}}
				>
					<Typography variant='h4' sx={{ fontWeight: 700 }}>
						Overview
					</Typography>
					<Button
						variant='text'
						endIcon={<KeyboardArrowDownIcon />}
						onClick={() => setDrawerOpen(true)}
						sx={{
							fontWeight: 700,
							fontSize: '1.5rem',
							textTransform: 'none',
							color: 'text.primary',
							px: 1,
						}}
					>
						{courseLabel}
					</Button>
				</Box>
				<Typography variant='body2' sx={{ color: 'text.secondary' }}>
					Get top insights about your performance
				</Typography>
			</Box>

			{/* Stats */}
			<Paper
				elevation={0}
				sx={{
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: 2,
					p: 3,
					mb: 3,
				}}
			>
				{loading || !data ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
						<CircularProgress size={28} />
					</Box>
				) : (
					<Box sx={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
						<Box>
							<Typography variant='caption' sx={{ color: 'text.secondary' }}>
								This month so far
							</Typography>
							<StatCard
								top={`$${data.thisMonthRevenue.toFixed(2)}`}
								topSub={`$${data.totalRevenue.toFixed(2)} total revenue`}
								label='Revenue'
								underline
							/>
						</Box>
						<Box
							sx={{ borderLeft: '1px solid', borderColor: 'divider', pl: 5 }}
						>
							<Typography variant='caption' sx={{ color: 'text.secondary' }}>
								This month so far
							</Typography>
							<StatCard
								top={String(data.thisMonthCount)}
								topSub={`${data.totalEnrollments} total enrollments`}
								label='Enrollments'
							/>
						</Box>
						<Box
							sx={{ borderLeft: '1px solid', borderColor: 'divider', pl: 5 }}
						>
							<Typography variant='caption' sx={{ color: 'text.secondary' }}>
								All time
							</Typography>
							<StatCard
								top={String(
									data.breakdown.free +
										data.breakdown.paid +
										data.breakdown.subscription,
								)}
								topSub={`${data.breakdown.paid} paid · ${data.breakdown.free} free · ${data.breakdown.subscription} subscription`}
								label='Total students'
							/>
						</Box>
					</Box>
				)}
			</Paper>

			{/* Chart controls */}
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					mb: 2,
					flexWrap: 'wrap',
					gap: 1.5,
				}}
			>
				<Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
					<Select
						size='small'
						value={metric}
						onChange={(e) => setMetric(e.target.value as ChartMetric)}
						sx={{ minWidth: 140 }}
					>
						<MenuItem value='revenue'>Revenue ($)</MenuItem>
						<MenuItem value='enrollments'>Enrollments</MenuItem>
					</Select>
					<Select
						size='small'
						value={dateRange}
						onChange={(e) => setDateRange(e.target.value as DateRange)}
						sx={{ minWidth: 140 }}
					>
						{DATE_RANGE_OPTIONS.map((o) => (
							<MenuItem key={o.value} value={o.value}>
								{o.label}
							</MenuItem>
						))}
					</Select>
				</Box>

				<ButtonGroup size='small' variant='outlined'>
					<Tooltip title='Line chart'>
						<Button
							onClick={() => setChartType('line')}
							variant={chartType === 'line' ? 'contained' : 'outlined'}
						>
							<ShowChartIcon fontSize='small' />
						</Button>
					</Tooltip>
					<Tooltip title='Bar chart'>
						<Button
							onClick={() => setChartType('bar')}
							variant={chartType === 'bar' ? 'contained' : 'outlined'}
						>
							<BarChartIcon fontSize='small' />
						</Button>
					</Tooltip>
					<Tooltip title='Pie chart'>
						<Button
							onClick={() => setChartType('pie')}
							variant={chartType === 'pie' ? 'contained' : 'outlined'}
						>
							<PieChartIcon fontSize='small' />
						</Button>
					</Tooltip>
				</ButtonGroup>
			</Box>

			{/* Chart */}
			<Paper
				elevation={0}
				sx={{
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: 2,
					p: 3,
					flex: 1,
					minHeight: 340,
				}}
			>
				{loading || !data ? (
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							height: 280,
						}}
					>
						<CircularProgress />
					</Box>
				) : data.chartData.length === 0 ? (
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							height: 280,
						}}
					>
						<Typography sx={{ color: 'text.secondary' }}>
							No data for the selected range.
						</Typography>
					</Box>
				) : chartType === 'pie' ? (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: 1,
						}}
					>
						<Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
							Enrollment breakdown (all time)
						</Typography>
						<ResponsiveContainer width='100%' height={280}>
							<PieChart>
								<Pie
									data={[
										{ name: 'Free', value: data.breakdown.free },
										{ name: 'Paid', value: data.breakdown.paid },
										{
											name: 'Subscription',
											value: data.breakdown.subscription,
										},
									]}
									dataKey='value'
									nameKey='name'
									cx='50%'
									cy='50%'
									outerRadius={110}
									label={({ name, value }) => `${name}: ${value}`}
								>
									{PIE_COLORS.map((color, i) => (
										<Cell key={i} fill={color} />
									))}
								</Pie>
								<ReTooltip />
								<Legend />
							</PieChart>
						</ResponsiveContainer>
					</Box>
				) : chartType === 'bar' ? (
					<ResponsiveContainer width='100%' height={280}>
						<BarChart
							data={data.chartData}
							margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
						>
							<CartesianGrid
								strokeDasharray='3 3'
								vertical={false}
								stroke='#e5e7eb'
							/>
							<XAxis
								dataKey='date'
								tick={{ fontSize: 11 }}
								interval='preserveStartEnd'
								axisLine={false}
								tickLine={false}
							/>
							<YAxis
								tick={{ fontSize: 11 }}
								axisLine={false}
								tickLine={false}
								tickFormatter={(v) =>
									metric === 'revenue' ? `$${v}` : String(v)
								}
							/>
							<ReTooltip formatter={tooltipFmt} />
							<Bar
								dataKey={metric}
								fill={metric === 'revenue' ? '#6366f1' : '#22c55e'}
								radius={[4, 4, 0, 0]}
								maxBarSize={40}
							/>
						</BarChart>
					</ResponsiveContainer>
				) : (
					<ResponsiveContainer width='100%' height={280}>
						<LineChart
							data={data.chartData}
							margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
						>
							<CartesianGrid
								strokeDasharray='3 3'
								vertical={false}
								stroke='#e5e7eb'
							/>
							<XAxis
								dataKey='date'
								tick={{ fontSize: 11 }}
								interval='preserveStartEnd'
								axisLine={false}
								tickLine={false}
							/>
							<YAxis
								tick={{ fontSize: 11 }}
								axisLine={false}
								tickLine={false}
								tickFormatter={(v) =>
									metric === 'revenue' ? `$${v}` : String(v)
								}
							/>
							<ReTooltip formatter={tooltipFmt} />
							<Line
								type='monotone'
								dataKey={metric}
								stroke={metric === 'revenue' ? '#6366f1' : '#22c55e'}
								strokeWidth={2}
								dot={false}
								activeDot={{ r: 5 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				)}

				<Divider sx={{ my: 2 }} />
				<Typography
					variant='body2'
					sx={{
						color: 'primary.main',
						fontWeight: 600,
						cursor: 'pointer',
						'&:hover': { textDecoration: 'underline' },
					}}
				>
					Revenue Report &rsaquo;
				</Typography>
			</Paper>

			{/* Course selector drawer */}
			<Drawer
				anchor='left'
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				sx={{
					'& .MuiDrawer-paper': {
						width: 400,
						backgroundColor: '#fff',
						display: 'flex',
						flexDirection: 'column',
					},
				}}
			>
				{/* Fixed header */}
				<div
					style={{
						padding: '28px 28px 0',
						flexShrink: 0,
						backgroundColor: '#fff',
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginBottom: 20,
						}}
					>
						<span style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>
							Select course
						</span>
						<IconButton
							onClick={() => setDrawerOpen(false)}
							size='small'
							sx={{ border: '1px solid #e0e0e0', borderRadius: '50%', p: 0.5 }}
						>
							<CloseIcon fontSize='small' />
						</IconButton>
					</div>

					{/* Filter row */}
					<div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
						<Select
							size='small'
							displayEmpty
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							sx={{ flex: 1, bgcolor: '#fff', borderRadius: 1 }}
						>
							<MenuItem value='all'>Course Category</MenuItem>
							{categories.map((cat) => (
								<MenuItem key={cat} value={cat}>
									{cat}
								</MenuItem>
							))}
						</Select>
					</div>

					{/* Search row */}
					<div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
						<TextField
							size='small'
							fullWidth
							placeholder='Search for a keyword'
							value={courseSearch}
							onChange={(e) => setCourseSearch(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
							sx={{
								'& .MuiOutlinedInput-root': { borderRadius: '4px 0 0 4px' },
							}}
						/>
						<Button
							variant='contained'
							sx={{
								borderRadius: '0 4px 4px 0',
								minWidth: 52,
								bgcolor: '#7c3aed',
								'&:hover': { bgcolor: '#6d28d9' },
								px: 1.5,
								flexShrink: 0,
							}}
						>
							<SearchIcon />
						</Button>
					</div>
				</div>

				{/* Scrollable list */}
				<div
					style={{
						flex: 1,
						overflowY: 'auto',
						padding: '0 28px 28px',
						backgroundColor: '#fff',
					}}
				>
					{/* All courses row */}
					<div
						onClick={() => handleCourseSelect('all', null)}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 16,
							padding: '16px 20px',
							border: '1px solid #e0e0e0',
							borderRadius: 4,
							cursor: 'pointer',
							backgroundColor: selectedCourseId === 'all' ? '#f5f3ff' : '#fff',
							marginBottom: 10,
						}}
					>
						<Radio
							checked={selectedCourseId === 'all'}
							size='small'
							sx={{
								p: 0,
								color: '#7c3aed',
								'&.Mui-checked': { color: '#7c3aed' },
							}}
						/>
						<span
							style={{
								fontSize: 15,
								fontWeight: selectedCourseId === 'all' ? 700 : 400,
								color: '#1a1a1a',
							}}
						>
							All courses
						</span>
					</div>

					{filteredCourses.length === 0 ? (
						<p style={{ color: '#9e9e9e', fontSize: 14, margin: '12px 0' }}>
							No courses match your search.
						</p>
					) : (
						filteredCourses.map((c) => {
							const selected = selectedCourseId === c._id;
							return (
								<div
									key={c._id}
									onClick={() => handleCourseSelect(c._id, c)}
									style={{
										display: 'flex',
										alignItems: 'flex-start',
										gap: 16,
										padding: '16px 20px',
										border: '1px solid #e0e0e0',
										borderRadius: 4,
										cursor: 'pointer',
										backgroundColor: selected ? '#f5f3ff' : '#fff',
										marginBottom: 10,
									}}
								>
									<Radio
										checked={selected}
										size='small'
										sx={{
											p: 0,
											mt: 0.25,
											flexShrink: 0,
											color: '#7c3aed',
											'&.Mui-checked': { color: '#7c3aed' },
										}}
									/>
									<div style={{ flex: 1, minWidth: 0 }}>
										<p
											style={{
												margin: 0,
												fontSize: 15,
												fontWeight: 400,
												lineHeight: 1.4,
												color: '#1a1a1a',
											}}
										>
											{c.title}
										</p>
										{c.status === 'Draft' && (
											<span
												style={{
													display: 'inline-block',
													marginTop: 6,
													fontSize: 11,
													fontWeight: 600,
													color: '#374151',
													backgroundColor: '#f3f4f6',
													border: '1px solid #d1d5db',
													borderRadius: 4,
													padding: '1px 8px',
												}}
											>
												Unpublished
											</span>
										)}
										{c.includedInSubscription && (
											<span
												style={{
													display: 'inline-block',
													marginTop: 6,
													marginLeft: c.status === 'Draft' ? 6 : 0,
													fontSize: 11,
													fontWeight: 600,
													color: '#7c3aed',
													backgroundColor: '#f5f3ff',
													border: '1px solid #ddd6fe',
													borderRadius: 4,
													padding: '1px 8px',
												}}
											>
												Subscription
											</span>
										)}
									</div>
								</div>
							);
						})
					)}
				</div>
			</Drawer>
		</Box>
	);
}
