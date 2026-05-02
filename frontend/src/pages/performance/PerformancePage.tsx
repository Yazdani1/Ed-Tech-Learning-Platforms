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
	InputAdornment,
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
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
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
			<Typography variant='caption' sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
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
		if (user && user.role !== 'Super Admin') navigate('/admin/dashboard', { replace: true });
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
	const [loading, setLoading] = useState(true);
	const abortRef = useRef<AbortController | null>(null);

	useEffect(() => {
		performanceService.getCourses().then((res) => setCourses(res.data ?? []));
	}, []);

	useEffect(() => {
		abortRef.current?.abort();
		const ctrl = new AbortController();
		abortRef.current = ctrl;
		setLoading(true);

		performanceService
			.getOverview(selectedCourseId, dateRange)
			.then((res) => {
				if (!ctrl.signal.aborted) setData(res.data ?? null);
			})
			.finally(() => {
				if (!ctrl.signal.aborted) setLoading(false);
			});
	}, [selectedCourseId, dateRange]);

	const filteredCourses = courses.filter((c) =>
		c.title.toLowerCase().includes(courseSearch.toLowerCase()),
	);

	const handleCourseSelect = (id: string, course: ICourse | null) => {
		setSelectedCourseId(id);
		setSelectedCourse(course);
		setDrawerOpen(false);
		setCourseSearch('');
	};

	if (user && user.role !== 'Super Admin') return null;

	const courseLabel = selectedCourse ? selectedCourse.title : 'All courses';
	const tooltipFmt = fmtTooltip(metric);

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
			{/* Header */}
			<Box sx={{ mb: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
					<Typography variant='h4' sx={{ fontWeight: 700 }}>
						Overview
					</Typography>
					<Button
						variant='text'
						endIcon={<KeyboardArrowDownIcon />}
						onClick={() => setDrawerOpen(true)}
						sx={{ fontWeight: 700, fontSize: '1.5rem', textTransform: 'none', color: 'text.primary', px: 1 }}
					>
						{courseLabel}
					</Button>
				</Box>
				<Typography variant='body2' sx={{ color: 'text.secondary' }}>
					Get top insights about your performance
				</Typography>
			</Box>

			{/* Stats */}
			<Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3, mb: 3 }}>
				{loading || !data ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
						<CircularProgress size={28} />
					</Box>
				) : (
					<Box sx={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
						<Box>
							<Typography variant='caption' sx={{ color: 'text.secondary' }}>This month so far</Typography>
							<StatCard
								top={`$${data.thisMonthRevenue.toFixed(2)}`}
								topSub={`$${data.totalRevenue.toFixed(2)} total revenue`}
								label='Revenue'
								underline
							/>
						</Box>
						<Box sx={{ borderLeft: '1px solid', borderColor: 'divider', pl: 5 }}>
							<Typography variant='caption' sx={{ color: 'text.secondary' }}>This month so far</Typography>
							<StatCard
								top={String(data.thisMonthCount)}
								topSub={`${data.totalEnrollments} total enrollments`}
								label='Enrollments'
							/>
						</Box>
						<Box sx={{ borderLeft: '1px solid', borderColor: 'divider', pl: 5 }}>
							<Typography variant='caption' sx={{ color: 'text.secondary' }}>All time</Typography>
							<StatCard
								top={String(data.breakdown.free + data.breakdown.paid + data.breakdown.subscription)}
								topSub={`${data.breakdown.paid} paid · ${data.breakdown.free} free · ${data.breakdown.subscription} subscription`}
								label='Total students'
							/>
						</Box>
					</Box>
				)}
			</Paper>

			{/* Chart controls */}
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
				<Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
					<Select size='small' value={metric} onChange={(e) => setMetric(e.target.value as ChartMetric)} sx={{ minWidth: 140 }}>
						<MenuItem value='revenue'>Revenue ($)</MenuItem>
						<MenuItem value='enrollments'>Enrollments</MenuItem>
					</Select>
					<Select size='small' value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRange)} sx={{ minWidth: 140 }}>
						{DATE_RANGE_OPTIONS.map((o) => (
							<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
						))}
					</Select>
				</Box>

				<ButtonGroup size='small' variant='outlined'>
					<Tooltip title='Line chart'>
						<Button onClick={() => setChartType('line')} variant={chartType === 'line' ? 'contained' : 'outlined'}>
							<ShowChartIcon fontSize='small' />
						</Button>
					</Tooltip>
					<Tooltip title='Bar chart'>
						<Button onClick={() => setChartType('bar')} variant={chartType === 'bar' ? 'contained' : 'outlined'}>
							<BarChartIcon fontSize='small' />
						</Button>
					</Tooltip>
					<Tooltip title='Pie chart'>
						<Button onClick={() => setChartType('pie')} variant={chartType === 'pie' ? 'contained' : 'outlined'}>
							<PieChartIcon fontSize='small' />
						</Button>
					</Tooltip>
				</ButtonGroup>
			</Box>

			{/* Chart */}
			<Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3, flex: 1, minHeight: 340 }}>
				{loading || !data ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
						<CircularProgress />
					</Box>
				) : data.chartData.length === 0 ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
						<Typography sx={{ color: 'text.secondary' }}>No data for the selected range.</Typography>
					</Box>
				) : chartType === 'pie' ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
						<Typography variant='subtitle2' sx={{ fontWeight: 700 }}>Enrollment breakdown (all time)</Typography>
						<ResponsiveContainer width='100%' height={280}>
							<PieChart>
								<Pie
									data={[
										{ name: 'Free', value: data.breakdown.free },
										{ name: 'Paid', value: data.breakdown.paid },
										{ name: 'Subscription', value: data.breakdown.subscription },
									]}
									dataKey='value'
									nameKey='name'
									cx='50%'
									cy='50%'
									outerRadius={110}
									label={({ name, value }) => `${name}: ${value}`}
								>
									{PIE_COLORS.map((color, i) => <Cell key={i} fill={color} />)}
								</Pie>
								<ReTooltip />
								<Legend />
							</PieChart>
						</ResponsiveContainer>
					</Box>
				) : chartType === 'bar' ? (
					<ResponsiveContainer width='100%' height={280}>
						<BarChart data={data.chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
							<CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#e5e7eb' />
							<XAxis dataKey='date' tick={{ fontSize: 11 }} interval='preserveStartEnd' axisLine={false} tickLine={false} />
							<YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => metric === 'revenue' ? `$${v}` : String(v)} />
							<ReTooltip formatter={tooltipFmt} />
							<Bar dataKey={metric} fill={metric === 'revenue' ? '#6366f1' : '#22c55e'} radius={[4, 4, 0, 0]} maxBarSize={40} />
						</BarChart>
					</ResponsiveContainer>
				) : (
					<ResponsiveContainer width='100%' height={280}>
						<LineChart data={data.chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
							<CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#e5e7eb' />
							<XAxis dataKey='date' tick={{ fontSize: 11 }} interval='preserveStartEnd' axisLine={false} tickLine={false} />
							<YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => metric === 'revenue' ? `$${v}` : String(v)} />
							<ReTooltip formatter={tooltipFmt} />
							<Line type='monotone' dataKey={metric} stroke={metric === 'revenue' ? '#6366f1' : '#22c55e'} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
						</LineChart>
					</ResponsiveContainer>
				)}

				<Divider sx={{ my: 2 }} />
				<Typography variant='body2' sx={{ color: 'primary.main', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
					Revenue Report &rsaquo;
				</Typography>
			</Paper>

			{/* Course selector drawer */}
			<Drawer
				anchor='left'
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				slotProps={{
					paper: {
						sx: { width: 360, p: 3 },
					},
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
					<Typography variant='h6' sx={{ fontWeight: 700 }}>Select course</Typography>
					<IconButton size='small' onClick={() => setDrawerOpen(false)}>
						<CloseIcon fontSize='small' />
					</IconButton>
				</Box>

				<TextField
					size='small'
					fullWidth
					placeholder='Search for a keyword'
					value={courseSearch}
					onChange={(e) => setCourseSearch(e.target.value)}
					sx={{ mb: 2 }}
					slotProps={{
						input: {
							endAdornment: (
								<InputAdornment position='end'>
									<SearchIcon fontSize='small' />
								</InputAdornment>
							),
						},
					}}
				/>

				{/* All courses card */}
				<Paper
					elevation={0}
					onClick={() => handleCourseSelect('all', null)}
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 1,
						px: 2,
						py: 1.5,
						mb: 1.5,
						borderRadius: 2,
						border: '2px solid',
						borderColor: selectedCourseId === 'all' ? 'primary.main' : 'divider',
						bgcolor: selectedCourseId === 'all' ? 'primary.50' : 'background.paper',
						cursor: 'pointer',
						transition: 'all 0.15s',
						'&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
					}}
				>
					<Radio checked={selectedCourseId === 'all'} size='small' sx={{ p: 0 }} />
					<Typography variant='body2' sx={{ fontWeight: 700 }}>All courses</Typography>
				</Paper>

				<Divider sx={{ mb: 1.5 }} />

				{/* Course cards */}
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, overflowY: 'auto' }}>
					{filteredCourses.map((c) => {
						const selected = selectedCourseId === c._id;
						return (
							<Paper
								key={c._id}
								elevation={0}
								onClick={() => handleCourseSelect(c._id, c)}
								sx={{
									borderRadius: 2,
									border: '2px solid',
									borderColor: selected ? 'primary.main' : 'divider',
									bgcolor: selected ? 'primary.50' : 'background.paper',
									cursor: 'pointer',
									overflow: 'hidden',
									transition: 'all 0.15s',
									'&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
								}}
							>
								{/* Thumbnail */}
								<Box
									sx={{
										width: '100%',
										height: 120,
										bgcolor: 'grey.200',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										overflow: 'hidden',
										flexShrink: 0,
									}}
								>
									{c.coverImage ? (
										<Box
											component='img'
											src={c.coverImage}
											alt={c.title}
											sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
										/>
									) : (
										<SchoolOutlinedIcon sx={{ fontSize: 36, color: 'grey.400' }} />
									)}
								</Box>

								{/* Footer row */}
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1.25 }}>
									<Radio checked={selected} size='small' sx={{ p: 0, flexShrink: 0 }} />
									<Box sx={{ flex: 1, minWidth: 0 }}>
										<Typography
											variant='body2'
											sx={{ fontWeight: selected ? 700 : 500, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
										>
											{c.title}
										</Typography>
										{c.status === 'Draft' && (
											<Typography variant='caption' sx={{ color: 'text.secondary' }}>Unpublished</Typography>
										)}
									</Box>
								</Box>
							</Paper>
						);
					})}

					{filteredCourses.length === 0 && (
						<Typography variant='body2' sx={{ color: 'text.secondary', px: 1, py: 2 }}>
							No courses match your search.
						</Typography>
					)}
				</Box>
			</Drawer>
		</Box>
	);
}
