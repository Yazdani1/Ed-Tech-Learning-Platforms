import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Container,
	Divider,
	Grid,
	List,
	ListItemButton,
	ListItemText,
	Paper,
	Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import CheckIcon from '@mui/icons-material/Check';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import DevicesIcon from '@mui/icons-material/Devices';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { courseService } from '../../services/course.service';
import { studyCurriculumService } from '../../services/studyCurriculum.service';
import { subscriptionPlanConfigService } from '../../services/subscriptionPlanConfig.service';
import { quizBankService } from '../../services/quizBank.service';
import PublicNavbar from '../../components/layout/PublicNavbar';
import AppModal from '../../components/common/AppModal';
import {
	formatLectureDuration,
	formatSectionDuration,
} from '../../utils/duration';
import {
	formatDate,
	formatDateTime,
	formatLiveClassDate,
	formatLiveClassTime,
} from '../../utils/dateTime';
import { formatBdt, getCoursePriceInfo } from '../../utils/pricing';
import type {
	ICourse,
	ILecture,
	IStudyCurriculum,
	ISubscriptionPlanConfig,
	IPublicQuizSection,
} from '../../types/index';
import { useAuth } from '../../context/useAuth';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import VerifiedIcon from '@mui/icons-material/Verified';

const ADMIN_ROLES = ['Super Admin', 'Admin', 'Moderator'] as const;

const CARD_PALETTE = [
	{ cardBg: '#e8f4fd', photoBg: '#bbdefb', accent: '#1565c0' },
	{ cardBg: '#f3e8fd', photoBg: '#e1bee7', accent: '#6a1b9a' },
	{ cardBg: '#e8fdf0', photoBg: '#c8e6c9', accent: '#2e7d32' },
	{ cardBg: '#fdf6e8', photoBg: '#ffe0b2', accent: '#e65100' },
	{ cardBg: '#fde8e8', photoBg: '#ffcdd2', accent: '#c62828' },
	{ cardBg: '#e8fdfd', photoBg: '#b2ebf2', accent: '#00695c' },
];

export default function CourseDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { user, isLoading: authLoading } = useAuth();
	const [course, setCourse] = useState<ICourse | null>(null);
	const [loading, setLoading] = useState(true);
	const [expanded, setExpanded] = useState<string[]>([]);
	const [liveExpanded, setLiveExpanded] = useState<string[]>([]);
	const [isEnrolled, setIsEnrolled] = useState(false);
	const [enrollmentDate, setEnrollmentDate] = useState<string | null>(null);
	const [enrolling, setEnrolling] = useState(false);
	const [subPlans, setSubPlans] = useState<ISubscriptionPlanConfig[]>([]);
	const [studyCurricula, setStudyCurricula] = useState<IStudyCurriculum[]>([]);
	const [quizSections, setQuizSections] = useState<IPublicQuizSection[]>([]);
	const [contentView, setContentView] = useState<'recorded' | 'curriculum' | 'quizzes'>(
		'recorded',
	);
	const [selectedOption, setSelectedOption] = useState<
		'subscription' | 'direct'
	>('direct');
	const [playingIntro, setPlayingIntro] = useState(false);
	const [previewLecture, setPreviewLecture] = useState<ILecture | null>(null);

	const isAdmin =
		user && (ADMIN_ROLES as readonly string[]).includes(user.role);
	const isStudent = user?.role === 'Student';
	const isModerator = user?.role === 'Moderator';

	const userActivePlan = user?.activeSubscription?.plan;
	const userSubExpiry = user?.activeSubscription?.endDate;
	const userSubValid =
		!!userActivePlan && !!userSubExpiry && new Date(userSubExpiry) > new Date();
	const courseInSub =
		(course?.includedInSubscription ?? false) &&
		(course?.allowedSubscriptionPlans?.length ?? 0) > 0;
	const userSubCoversThisCourse =
		courseInSub &&
		userSubValid &&
		(course?.allowedSubscriptionPlans ?? []).includes(userActivePlan!);
	const userHasWrongPlan =
		courseInSub && isStudent && userSubValid && !userSubCoversThisCourse;

	const lowestSubPrice = subPlans
		.filter((p) => (course?.allowedSubscriptionPlans ?? []).includes(p.plan))
		.reduce<number>((min, p) => Math.min(min, p.price), Infinity);

	const planCountMap = Object.fromEntries(
		subPlans.map((p) => [p.plan, p.courseCount]),
	) as Partial<Record<string, number>>;
	const priceInfo = course ? getCoursePriceInfo(course) : null;

	useEffect(() => {
		if (!id || authLoading) return;
		courseService
			.getById(id)
			.then((r) => {
				const c = r.data;
				if (!c) return;
				if (c.visibility === 'Public' || user) {
					setCourse(c);
					if (
						c.includedInSubscription &&
						(c.allowedSubscriptionPlans?.length ?? 0) > 0
					) {
						setSelectedOption('subscription');
					}
				} else {
					navigate('/auth/login');
				}
			})
			.finally(() => setLoading(false));
	}, [id, authLoading, user, navigate]);

	useEffect(() => {
		if (!id || !isStudent) return;
		courseService
			.checkEnrollment(id)
			.then((r) => {
				setIsEnrolled(r.data?.isEnrolled ?? false);
				setEnrollmentDate(r.data?.enrolledAt ?? null);
			})
			.catch(() => {
				/* not enrolled */
			});
	}, [id, isStudent]);

	useEffect(() => {
		if (!id) return;
		studyCurriculumService
			.getByCourse(id)
			.then((r) => setStudyCurricula(r.data ?? []))
			.catch(() => {});
	}, [id]);

	useEffect(() => {
		if (!id) return;
		quizBankService
			.getPublicCourseTree(id)
			.then((r) => setQuizSections(r.data?.sections ?? []))
			.catch(() => {});
	}, [id]);

	useEffect(() => {
		subscriptionPlanConfigService
			.getAll()
			.then((r) => setSubPlans(r.data ?? []));
	}, []);

	const handleEnroll = async () => {
		if (!id) return;
		setEnrolling(true);
		try {
			await courseService.enroll(
				id,
				course?.pricing === 'Paid' && selectedOption === 'direct'
					? 'paid'
					: undefined,
			);
			setIsEnrolled(true);
			toast.success('Enrolled successfully!');
		} finally {
			setEnrolling(false);
		}
	};

	if (loading)
		return (
			<Box sx={{ minHeight: '100vh' }}>
				<PublicNavbar />
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 12 }}>
					<CircularProgress />
				</Box>
			</Box>
		);

	if (!course)
		return (
			<Box sx={{ minHeight: '100vh' }}>
				<PublicNavbar />
				<Box sx={{ textAlign: 'center', mt: 12 }}>
					<Typography variant='h5'>Course not found.</Typography>
					<Button component={RouterLink} to='/' sx={{ mt: 2 }}>
						Back to Home
					</Button>
				</Box>
			</Box>
		);

	const totalLectures =
		course.sections?.reduce((acc, s) => acc + s.lectures.length, 0) ?? 0;
	const hasRecordedContent = (course.sections?.length ?? 0) > 0;
	const hasStudyCurriculum = studyCurricula.length > 0;
	const hasQuizzes = quizSections.length > 0;
	const showContentTabs = (hasRecordedContent ? 1 : 0) + (hasStudyCurriculum ? 1 : 0) + (hasQuizzes ? 1 : 0) > 1;

	const activeContentView = (() => {
		if (contentView === 'recorded' && hasRecordedContent) return 'recorded';
		if (contentView === 'curriculum' && hasStudyCurriculum) return 'curriculum';
		if (contentView === 'quizzes' && hasQuizzes) return 'quizzes';
		if (hasRecordedContent) return 'recorded';
		if (hasStudyCurriculum) return 'curriculum';
		if (hasQuizzes) return 'quizzes';
		return 'recorded';
	})();
	const totalCurriculumClasses = studyCurricula.reduce(
		(total, curriculum) => total + curriculum.lectures.length,
		0,
	);

	// Find intro lecture: first lecture named "Course Introduction" OR first isPreview lecture, OR first lecture with a videoUrl
	const introLecture = (() => {
		for (const section of course.sections ?? []) {
			for (const lec of section.lectures) {
				if (
					lec.title.toLowerCase().includes('course introduction') &&
					lec.videoUrl
				)
					return lec;
			}
		}
		for (const section of course.sections ?? []) {
			for (const lec of section.lectures) {
				if (lec.isPreview && lec.videoUrl) return lec;
			}
		}
		return null;
	})();

	const getYouTubeId = (url: string) => {
		const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
		return m ? m[1] : null;
	};

	// Calculate total duration for a section
	const getSectionDuration = (section: (typeof course.sections)[0]) => {
		return section.lectures.reduce(
			(total, lec) => total + (lec.duration ?? 0),
			0,
		);
	};

	const introVideoId = introLecture
		? getYouTubeId(introLecture.videoUrl!)
		: null;

	const allPreviewLectures: ILecture[] = (course.sections ?? []).flatMap((s) =>
		s.lectures.filter((l) => l.isPreview && l.videoUrl),
	);

	return (
		<Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
			<PublicNavbar />

			<Box sx={{ bgcolor: '#1c1d1f', color: 'white', py: { xs: 5, md: 7 } }}>
				<Container maxWidth='lg'>
					<Grid container spacing={4}>
						{/* Left: course info */}
						<Grid size={{ xs: 12, md: 8 }}>
							{/* Breadcrumb */}
							<Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
								<Typography
									component={RouterLink}
									to='/'
									variant='caption'
									sx={{
										color: '#a78bfa',
										textDecoration: 'none',
										'&:hover': { textDecoration: 'underline' },
									}}
								>
									Home
								</Typography>
								{course.category?.name && (
									<>
										<Typography variant='caption' sx={{ color: 'grey.500' }}>
											»
										</Typography>
										<Typography variant='caption' sx={{ color: '#a78bfa' }}>
											{course.category.name}
										</Typography>
									</>
								)}
								{course.courseType?.name && (
									<>
										<Typography variant='caption' sx={{ color: 'grey.500' }}>
											»
										</Typography>
										<Typography variant='caption' sx={{ color: '#a78bfa' }}>
											{course.courseType.name}
										</Typography>
									</>
								)}
							</Box>

							<Typography
								variant='h4'
								sx={{
									fontWeight: 800,
									mb: 1.5,
									lineHeight: 1.25,
									fontSize: { xs: '1.6rem', md: '2rem' },
								}}
							>
								{course.title}
							</Typography>

							{course.subtitle && (
								<Typography
									variant='h6'
									sx={{
										fontWeight: 400,
										opacity: 0.85,
										mb: 2,
										fontSize: { xs: '1rem', md: '1.15rem' },
									}}
								>
									{course.subtitle}
								</Typography>
							)}

							<Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
								<Chip
									label={course.status}
									size='small'
									sx={{
										bgcolor:
											course.status === 'Published' ? '#16a34a' : '#6b7280',
										color: 'white',
										fontWeight: 600,
									}}
								/>
								<Chip
									label={
										course.pricing === 'Paid'
											? priceInfo?.hasDiscount
												? `${formatBdt(priceInfo.discountPrice)} (${priceInfo.discountPercent}% off)`
												: formatBdt(priceInfo?.discountPrice ?? course.price)
											: 'Free'
									}
									size='small'
									sx={{
										bgcolor: course.pricing === 'Free' ? '#0284c7' : '#d97706',
										color: 'white',
										fontWeight: 600,
									}}
								/>
								{course.courseType?.name && (
									<Chip
										icon={
											<ClassIcon
												sx={{
													fontSize: '14px !important',
													color: 'white !important',
												}}
											/>
										}
										label={course.courseType.name}
										size='small'
										sx={{ bgcolor: '#0f766e', color: 'white', fontWeight: 600 }}
									/>
								)}
								{course.includedInSubscription && (
									<Chip
										label='Subscription'
										size='small'
										sx={{ bgcolor: '#7c3aed', color: 'white', fontWeight: 600 }}
									/>
								)}
							</Box>

							{course.teachers?.length > 0 && (
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										gap: 1,
										flexWrap: 'wrap',
									}}
								>
									<Typography variant='body2' sx={{ opacity: 0.75 }}>
										Created by
									</Typography>
									{course.teachers.map((t, i) => (
										<Typography
											key={t._id}
											variant='body2'
											sx={{ color: '#a78bfa', fontWeight: 500 }}
										>
											{t.name}
											{i < course.teachers.length - 1 ? ',' : ''}
										</Typography>
									))}
								</Box>
							)}
						</Grid>
					</Grid>
				</Container>
			</Box>

			{/* â”€â”€ Body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
			<Container maxWidth='lg' sx={{ py: { xs: 4, md: 6 } }}>
				<Grid container spacing={4} sx={{ alignItems: 'flex-start' }}>
					{/* â”€â”€ Left column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
					<Grid size={{ xs: 12, md: 8 }}>
						{/* â”€â”€ Course Type & Schedule Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
						{(course.courseType || course.startDate || course.endDate) && (
							<Box
								sx={{
									mb: 4,
									borderRadius: 2,
									overflow: 'hidden',
									border: '1px solid',
									borderColor: 'divider',
									boxShadow: '0 2px 12px rgba(15,118,110,0.08)',
								}}
							>
								{/* Animated gradient top bar */}
								<Box
									sx={{
										height: 5,
										background:
											'linear-gradient(90deg, #0f766e, #7c3aed, #0ea5e9, #0f766e)',
										backgroundSize: '300% 100%',
										animation: 'barSlide 4s linear infinite',
										'@keyframes barSlide': {
											'0%': { backgroundPosition: '0% 0%' },
											'100%': { backgroundPosition: '300% 0%' },
										},
									}}
								/>

								<Box sx={{ p: 3 }}>
									{course.courseType && (
										<Box
											sx={{ mb: course.startDate || course.endDate ? 2.5 : 0 }}
										>
											<Typography
												variant='overline'
												sx={{
													color: 'text.disabled',
													letterSpacing: 2,
													fontSize: '0.7rem',
													display: 'block',
													mb: 0.75,
												}}
											>
												Course Type
											</Typography>

											{/* Animated shimmer type name */}
											<Typography
												variant='h5'
												sx={{
													fontWeight: 900,
													display: 'inline-block',
													background:
														'linear-gradient(90deg, #0f766e 0%, #7c3aed 40%, #0ea5e9 70%, #0f766e 100%)',
													backgroundSize: '250% auto',
													WebkitBackgroundClip: 'text',
													WebkitTextFillColor: 'transparent',
													backgroundClip: 'text',
													animation: 'typeShimmer 3s linear infinite',
													'@keyframes typeShimmer': {
														'0%': { backgroundPosition: '0% center' },
														'100%': { backgroundPosition: '250% center' },
													},
													mb: course.courseType.description ? 1 : 0,
												}}
											>
												{course.courseType.name}
											</Typography>

											{course.courseType.description && (
												<Typography
													variant='body2'
													color='text.secondary'
													sx={{ lineHeight: 1.7 }}
												>
													{course.courseType.description}
												</Typography>
											)}
										</Box>
									)}

									{(course.startDate || course.endDate) && (
										<>
											{course.courseType && <Divider sx={{ mb: 2.5 }} />}
											<Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
												{course.startDate && (
													<Box>
														<Typography
															variant='caption'
															sx={{
																color: 'text.disabled',
																textTransform: 'uppercase',
																letterSpacing: 1.5,
																display: 'block',
																mb: 0.5,
															}}
														>
															Start Date
														</Typography>
														<Box
															sx={{
																display: 'flex',
																alignItems: 'center',
																gap: 1,
															}}
														>
															<CalendarTodayIcon
																sx={{ fontSize: 18, color: '#0f766e' }}
															/>
															<Typography
																sx={{ fontWeight: 700, fontSize: '0.95rem' }}
															>
																{formatDate(course.startDate)}
															</Typography>
														</Box>
													</Box>
												)}
												{course.endDate && (
													<Box>
														<Typography
															variant='caption'
															sx={{
																color: 'text.disabled',
																textTransform: 'uppercase',
																letterSpacing: 1.5,
																display: 'block',
																mb: 0.5,
															}}
														>
															End Date
														</Typography>
														<Box
															sx={{
																display: 'flex',
																alignItems: 'center',
																gap: 1,
															}}
														>
															<EventIcon
																sx={{ fontSize: 18, color: '#7c3aed' }}
															/>
															<Typography
																sx={{ fontWeight: 700, fontSize: '0.95rem' }}
															>
																{formatDate(course.endDate)}
															</Typography>
														</Box>
													</Box>
												)}
											</Box>
										</>
									)}
								</Box>
							</Box>
						)}

						{/* What you'll learn */}
						{course.whatYouWillLearn?.length > 0 && (
							<Box
								sx={{
									border: '1px solid',
									borderColor: 'divider',
									borderRadius: 2,
									p: 3,
									mb: 4,
								}}
							>
								<Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
									What you&apos;ll learn
								</Typography>
								<Grid container spacing={1}>
									{course.whatYouWillLearn.map((item, i) => (
										<Grid key={i} size={{ xs: 12, sm: 6 }}>
											<Box
												sx={{
													display: 'flex',
													gap: 1,
													alignItems: 'flex-start',
												}}
											>
												<CheckIcon
													sx={{
														fontSize: 18,
														color: 'success.main',
														mt: 0.25,
														flexShrink: 0,
													}}
												/>
												<Typography variant='body2'>{item}</Typography>
											</Box>
										</Grid>
									))}
								</Grid>
							</Box>
						)}

						{/* Course includes */}
						<Box sx={{ mb: 4 }}>
							<Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
								This course includes
							</Typography>
							<Grid container spacing={1.5}>
								{[
									{
										icon: <OndemandVideoIcon fontSize='small' />,
										text: `${totalLectures} on-demand video lectures`,
									},
									...(hasStudyCurriculum
										? [
												{
													icon: <EventIcon fontSize='small' />,
													text: `${studyCurricula.length} live class plan${studyCurricula.length !== 1 ? 's' : ''}`,
												},
											]
										: []),
									{
										icon: <AllInclusiveIcon fontSize='small' />,
										text: 'Full lifetime access',
									},
									{
										icon: <DevicesIcon fontSize='small' />,
										text: 'Access on all devices',
									},
									{
										icon: <WorkspacePremiumIcon fontSize='small' />,
										text: 'Certificate of completion',
									},
								].map(({ icon, text }) => (
									<Grid key={text} size={{ xs: 12, sm: 6 }}>
										<Box
											sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}
										>
											<Box sx={{ color: 'text.secondary' }}>{icon}</Box>
											<Typography variant='body2'>{text}</Typography>
										</Box>
									</Grid>
								))}
							</Grid>
						</Box>

						<Divider sx={{ mb: 4 }} />

						{/* Course content */}
						{(hasRecordedContent || hasStudyCurriculum) && (
							<Box
								sx={{
									mb: 4,
									width: { md: 'calc(100% + 80px)' },
									maxWidth: { md: 'calc(100vw - 48px)' },
								}}
							>
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										mb: 2,
										flexWrap: 'wrap',
										gap: 1,
									}}
								>
									<Typography variant='h6' sx={{ fontWeight: 700 }}>
										Course content
									</Typography>
									{activeContentView === 'recorded' && (
										<Button
											size='small'
											onClick={() => {
												if (!course?.sections) return;
												const allIds = course.sections.map((s) => s._id);
												if (expanded.length === allIds.length) {
													setExpanded([]);
												} else {
													setExpanded(allIds);
												}
											}}
											sx={{ color: 'primary.main', fontWeight: 600 }}
										>
											{expanded.length === (course?.sections?.length ?? 0) &&
											(course?.sections?.length ?? 0) > 0
												? 'Collapse all sections'
												: 'Expand all sections'}
										</Button>
									)}
									{activeContentView === 'curriculum' && (
										<Button
											size='small'
											onClick={() => {
												const allIds = studyCurricula.map((item) => item._id);
												if (liveExpanded.length === allIds.length) {
													setLiveExpanded([]);
												} else {
													setLiveExpanded(allIds);
												}
											}}
											sx={{ color: 'primary.main', fontWeight: 600 }}
										>
											{liveExpanded.length === studyCurricula.length &&
											studyCurricula.length > 0
												? 'Collapse all weeks'
												: 'Expand all weeks'}
										</Button>
									)}
								</Box>

								{showContentTabs && (
									<Box
										sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}
									>
										<Button
											size='small'
											variant={
												activeContentView === 'recorded'
													? 'contained'
													: 'outlined'
											}
											startIcon={<OndemandVideoIcon fontSize='small' />}
											onClick={() => setContentView('recorded')}
										>
											Recorded Lectures
										</Button>
										<Button
											size='small'
											variant={
												activeContentView === 'curriculum'
													? 'contained'
													: 'outlined'
											}
											startIcon={<EventIcon fontSize='small' />}
											onClick={() => setContentView('curriculum')}
										>
											Live Class
										</Button>
										<Button
											size='small'
											variant={
												activeContentView === 'quizzes'
													? 'contained'
													: 'outlined'
											}
											startIcon={<QuizOutlinedIcon fontSize='small' />}
											onClick={() => setContentView('quizzes')}
										>
											Quizzes
										</Button>
									</Box>
								)}

								<Typography
									variant='body2'
									color='text.secondary'
									sx={{ mb: 2 }}
								>
									{activeContentView === 'recorded'
										? `${course.sections.length} sections - ${totalLectures} lectures`
										: activeContentView === 'curriculum'
											? `${studyCurricula.length} weeks - ${totalCurriculumClasses} classes`
											: `${quizSections.length} quiz sections - ${quizSections.reduce((acc, s) => acc + s.banks.length, 0)} quiz banks`}
								</Typography>

								{activeContentView === 'recorded' && (
									<Box
										sx={{
											border: '1px solid',
											borderColor: 'divider',
											borderRadius: 2,
											overflow: 'hidden',
										}}
									>
										{course.sections.map((section, si) => (
											<Accordion
												key={section._id}
												expanded={expanded.includes(section._id)}
												onChange={(_e, isExpanded) => {
													setExpanded((prev) =>
														isExpanded
															? [...prev, section._id]
															: prev.filter((id) => id !== section._id),
													);
												}}
												elevation={0}
												disableGutters
												sx={{
													borderBottom:
														si < course.sections.length - 1
															? '1px solid'
															: 'none',
													borderColor: 'divider',
													'&::before': { display: 'none' },
												}}
											>
												<AccordionSummary
													expandIcon={<ExpandMoreIcon />}
													sx={{
														bgcolor: 'grey.50',
														px: 2.5,
														py: 1.5,
														minHeight: 56,
													}}
												>
													<Typography sx={{ fontWeight: 600, flex: 1 }}>
														{section.title}
													</Typography>
													<Typography
														variant='caption'
														color='text.secondary'
														sx={{ mr: 1, alignSelf: 'center' }}
													>
														{section.lectures.length} lecture
														{section.lectures.length !== 1 ? 's' : ''} •{' '}
														{formatSectionDuration(getSectionDuration(section))}
													</Typography>
												</AccordionSummary>
												<AccordionDetails sx={{ p: 0 }}>
													{section.lectures.map((lecture, li) => {
														const canPreview =
															lecture.isPreview && !!lecture.videoUrl;
														return (
															<Box
																key={lecture._id}
																onClick={
																	canPreview
																		? () => setPreviewLecture(lecture)
																		: undefined
																}
																sx={{
																	display: 'flex',
																	alignItems: 'center',
																	gap: 1.5,
																	px: 2.5,
																	py: 1.25,
																	borderTop: li > 0 ? '1px solid' : 'none',
																	borderColor: 'divider',
																	...(canPreview && {
																		cursor: 'pointer',
																		'&:hover': { bgcolor: 'action.hover' },
																	}),
																}}
															>
																<PlayCircleOutlinedIcon
																	fontSize='small'
																	sx={{
																		color: canPreview
																			? 'info.main'
																			: 'action.active',
																	}}
																/>
																<Typography
																	variant='body2'
																	sx={{
																		flex: 1,
																		color: canPreview ? 'info.main' : 'inherit',
																	}}
																>
																	{lecture.title}
																</Typography>
																{lecture.duration && (
																	<Typography
																		variant='caption'
																		color='text.secondary'
																		sx={{ mr: 1 }}
																	>
																		{formatLectureDuration(lecture.duration)}
																	</Typography>
																)}
																{lecture.isPreview && (
																	<Chip
																		label='Free Preview'
																		size='small'
																		color='info'
																		variant='outlined'
																	/>
																)}
															</Box>
														);
													})}
													{section.lectures.length === 0 && (
														<Box sx={{ px: 2.5, py: 2 }}>
															<Typography
																variant='body2'
																color='text.secondary'
															>
																No lectures yet.
															</Typography>
														</Box>
													)}
												</AccordionDetails>
											</Accordion>
										))}
									</Box>
								)}

								{activeContentView === 'curriculum' && (
									<Box
										sx={{
											display: 'grid',
											gridTemplateColumns: '1fr',
											gap: 2.5,
											alignItems: 'start',
										}}
									>
										{studyCurricula.map((curriculum, ci) => (
											<Accordion
												key={curriculum._id}
												expanded={liveExpanded.includes(curriculum._id)}
												onChange={(_event, isExpanded) => {
													setLiveExpanded((prev) =>
														isExpanded
															? [...prev, curriculum._id]
															: prev.filter((id) => id !== curriculum._id),
													);
												}}
												elevation={0}
												disableGutters
												sx={{
													border: '1px solid',
													borderColor: 'divider',
													borderRadius: '8px !important',
													overflow: 'hidden',
													bgcolor: 'background.paper',
													boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
													'&::before': { display: 'none' },
												}}
											>
												<AccordionSummary
													expandIcon={<ExpandMoreIcon />}
													sx={{
														bgcolor: 'background.paper',
														px: 2.5,
														py: 1.5,
														minHeight: 92,
														'& .MuiAccordionSummary-content': {
															alignItems: 'center',
															gap: 1.5,
															minWidth: 0,
														},
													}}
												>
													<Box sx={{ flex: 1, minWidth: 0 }}>
														<Box
															sx={{
																display: 'flex',
																gap: 1.5,
																alignItems: 'center',
															}}
														>
															<Box
																sx={{
																	width: 64,
																	minHeight: 78,
																	borderRadius: 1,
																	bgcolor:
																		ci % 3 === 0
																			? '#f59e0b'
																			: ci % 3 === 1
																				? '#fb7c3c'
																				: '#0ea5e9',
																	color: 'white',
																	display: 'flex',
																	flexDirection: 'column',
																	alignItems: 'center',
																	justifyContent: 'center',
																	textAlign: 'center',
																	fontSize: '0.8rem',
																	fontWeight: 800,
																	lineHeight: 1.15,
																	flexShrink: 0,
																}}
															>
																<Typography
																	sx={{
																		fontSize: '0.78rem',
																		fontWeight: 800,
																		lineHeight: 1.1,
																	}}
																>
																	Week
																</Typography>
																<Typography
																	sx={{
																		fontSize: '1.25rem',
																		fontWeight: 900,
																		lineHeight: 1.1,
																	}}
																>
																	{ci + 1}
																</Typography>
															</Box>
															<Typography
																sx={{
																	fontWeight: 800,
																	fontSize: '1rem',
																	color: '#111827',
																}}
															>
																{curriculum.title || curriculum.weekName}
															</Typography>
														</Box>
													</Box>
													<Box
														sx={{
															display: { xs: 'none', sm: 'flex' },
															alignItems: 'center',
															gap: 0.75,
															mr: 1,
															px: 1.25,
															py: 0.65,
															borderRadius: 1,
															bgcolor: 'grey.100',
															color: '#111827',
															flexShrink: 0,
														}}
													>
														<EventIcon sx={{ fontSize: 17 }} />
														<Typography
															variant='caption'
															sx={{ fontWeight: 800 }}
														>
															{curriculum.lectures.length} Live Class
														</Typography>
													</Box>
												</AccordionSummary>
												<AccordionDetails sx={{ p: 0 }}>
													<Box
														sx={{
															px: 2.5,
															py: 1.5,
															fontSize: '0.9rem',
															lineHeight: 1.7,
															color: 'text.secondary',
															'& p': { m: 0, mb: 0.5 },
															'& ul, & ol': { pl: 2.5, my: 0.5 },
														}}
														dangerouslySetInnerHTML={{
															__html: curriculum.description,
														}}
													/>
													<Box
														sx={{
															display: 'flex',
															alignItems: 'center',
															gap: 2.5,
															px: 2.5,
															py: 1.25,
															borderTop: '1px solid',
															borderColor: 'divider',
															bgcolor: 'background.paper',
														}}
													>
														<Box
															sx={{
																display: 'flex',
																alignItems: 'center',
																gap: 0.75,
															}}
														>
															<EventIcon
																sx={{ fontSize: 18, color: 'primary.main' }}
															/>
															<Typography
																variant='subtitle2'
																sx={{ fontWeight: 800 }}
															>
																{curriculum.lectures.length} Live Class
															</Typography>
														</Box>
													</Box>
													{curriculum.lectures.map((lecture, index) => (
														<Box
															key={lecture._id ?? index}
															sx={{
																display: 'flex',
																gap: 1.25,
																alignItems: 'flex-start',
																px: 2.5,
																py: 1.5,
																borderTop: '1px solid',
																borderColor: 'divider',
															}}
														>
															<Box sx={{ flex: 1, minWidth: 0 }}>
																<Box
																	sx={{
																		display: 'flex',
																		alignItems: 'flex-start',
																		justifyContent: 'space-between',
																		gap: 2,
																		mb: 0.75,
																	}}
																>
																	<Typography
																		variant='body2'
																		sx={{ fontWeight: 800, color: '#111827' }}
																	>
																		{lecture.title}
																	</Typography>
																	<Box
																		sx={{
																			display: 'flex',
																			gap: 1,
																			alignItems: 'center',
																			flexShrink: 0,
																		}}
																	>
																		<Chip
																			icon={
																				<CalendarTodayIcon
																					sx={{ fontSize: 14 }}
																				/>
																			}
																			label={formatLiveClassDate(lecture.day)}
																			size='small'
																			sx={{
																				bgcolor: '#e0f2fe',
																				color: '#075985',
																				fontWeight: 700,
																				borderRadius: 1,
																			}}
																		/>
																		<Chip
																			icon={
																				<AccessTimeIcon sx={{ fontSize: 14 }} />
																			}
																			label={formatLiveClassTime(lecture.time)}
																			size='small'
																			variant='outlined'
																		/>
																	</Box>
																</Box>
																{lecture.description && (
																	<Typography
																		variant='body2'
																		color='text.secondary'
																	>
																		{lecture.description}
																	</Typography>
																)}
															</Box>
														</Box>
													))}
												</AccordionDetails>
											</Accordion>
										))}
									</Box>
								)}

								{activeContentView === 'quizzes' && (
									<Box
										sx={{
											border: '1px solid',
											borderColor: 'divider',
											borderRadius: 2,
											overflow: 'hidden',
										}}
									>
										{quizSections.map((section, si) => (
											<Accordion
												key={section._id}
												elevation={0}
												disableGutters
												defaultExpanded={si === 0}
												sx={{
													borderBottom:
														si < quizSections.length - 1
															? '1px solid'
															: 'none',
													borderColor: 'divider',
													'&::before': { display: 'none' },
												}}
											>
												<AccordionSummary
													expandIcon={<ExpandMoreIcon />}
													sx={{
														bgcolor: 'grey.50',
														minHeight: 48,
														'&.Mui-expanded': { minHeight: 48 },
													}}
												>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
														<Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>
															{section.title}
														</Typography>
														{section.isFreePreview && (
															<Chip 
																label="Free Preview" 
																size="small" 
																sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: 'success.main', color: 'white' }} 
															/>
														)}
													</Box>
												</AccordionSummary>
												<AccordionDetails sx={{ p: 0 }}>
													<List disablePadding>
														{section.banks.map((bank, bi) => (
															<ListItemButton
																key={bank._id}
																component={RouterLink}
																to={`/practice-quiz?courseId=${id}&bankId=${bank._id}`}
																sx={{
																	px: 3,
																	py: 1.5,
																	borderBottom:
																		bi < section.banks.length - 1
																			? '1px solid'
																			: 'none',
																	borderColor: 'divider',
																	display: 'flex',
																	justifyContent: 'space-between',
																}}
															>
																<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
																	<QuizOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
																	<Typography variant='body2' sx={{ fontWeight: 600 }}>
																		{bank.title}
																	</Typography>
																</Box>
																{(section.isFreePreview || bank.isFreePreview) && (
																	<Chip 
																		label="Free Preview" 
																		size="small" 
																		variant="outlined"
																		sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, borderColor: 'success.main', color: 'success.main' }} 
															/>
																)}
															</ListItemButton>
														))}
													</List>
												</AccordionDetails>
											</Accordion>
										))}
										{quizSections.length === 0 && (
											<Box sx={{ p: 4, textAlign: 'center' }}>
												<Typography variant='body2' color='text.secondary'>
													No quizzes available for this course yet.
												</Typography>
											</Box>
										)}
									</Box>
								)}
							</Box>
						)}

						{/* Requirements */}
						{course.requirements?.length > 0 && (
							<Box sx={{ mb: 4 }}>
								<Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
									Requirements
								</Typography>
								<Box component='ul' sx={{ pl: 3, m: 0 }}>
									{course.requirements.map((item, i) => (
										<Box component='li' key={i} sx={{ mb: 0.75 }}>
											<Typography variant='body2'>{item}</Typography>
										</Box>
									))}
								</Box>
							</Box>
						)}

						{/* Description */}
						{course.description && (
							<Box sx={{ mb: 4 }}>
								<Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
									About this course
								</Typography>
								<Box
									dangerouslySetInnerHTML={{ __html: course.description }}
									sx={{
										'& p': { mt: 0, mb: 1.5 },
										'& ul': { pl: 3 },
										lineHeight: 1.8,
									}}
								/>
							</Box>
						)}

						<Divider sx={{ mb: 4 }} />

						{/* Teachers */}
						{course.teachers?.length > 0 && (
							<Box sx={{ mb: 4 }}>
								<Typography variant='h5' sx={{ fontWeight: 700, mb: 3 }}>
									Your Instructors
								</Typography>
								<Grid container spacing={2}>
									{course.teachers.map((teacher, idx) => {
										const palette = CARD_PALETTE[idx % CARD_PALETTE.length];
										return (
											<Grid key={teacher._id} size={{ xs: 12, sm: 6, md: 6 }}>
												<Box
													sx={{
														bgcolor: palette.cardBg,
														borderRadius: 3,
														p: 2.5,
														height: '100%',
														display: 'flex',
														flexDirection: 'column',
														alignItems: 'center',
														textAlign: 'center',
													}}
												>
													{/* Photo area */}
													<Box
														sx={{
															width: 100,
															height: 100,
															borderRadius: '50%',
															bgcolor: palette.photoBg,
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															mb: 2,
															flexShrink: 0,
														}}
													>
														<Avatar
															src={teacher.profileImage}
															alt={teacher.name}
															sx={{
																width: 88,
																height: 88,
																fontSize: 32,
																bgcolor: palette.accent,
															}}
														>
															{teacher.name.charAt(0)}
														</Avatar>
													</Box>

													<Typography
														variant='subtitle1'
														sx={{ fontWeight: 700, mb: 0.5 }}
													>
														{teacher.name}
													</Typography>

													{teacher.bio && (
														<Typography
															variant='body2'
															color='text.secondary'
															sx={{ mb: 1.5, lineHeight: 1.5 }}
														>
															{teacher.bio.length > 80
																? `${teacher.bio.slice(0, 80)}…`
																: teacher.bio}
														</Typography>
													)}

													{teacher.expertise?.length > 0 && (
														<Box
															sx={{
																display: 'flex',
																gap: 0.5,
																flexWrap: 'wrap',
																justifyContent: 'center',
															}}
														>
															{teacher.expertise.slice(0, 3).map((exp) => (
																<Chip
																	key={exp}
																	label={exp}
																	size='small'
																	sx={{
																		bgcolor: palette.accent,
																		color: 'white',
																		fontWeight: 500,
																		fontSize: '0.7rem',
																	}}
																/>
															))}
														</Box>
													)}
												</Box>
											</Grid>
										);
									})}
								</Grid>
							</Box>
						)}
					</Grid>

					{/* â”€â”€ Right sticky card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
					<Grid size={{ xs: 12, md: 4 }} sx={{ mt: { md: -32 }, zIndex: 10 }}>
						<Box sx={{ position: 'sticky', top: 90 }}>
							<Paper
								elevation={3}
								sx={{ borderRadius: 0.5, overflow: 'hidden' }}
							>
								{/* Intro video / cover image */}
								<Box
									sx={{
										width: '100%',
										height: 200,
										bgcolor: 'grey.900',
										position: 'relative',
										overflow: 'hidden',
									}}
								>
									{introVideoId && playingIntro ? (
										/* Embedded YouTube player */
										<Box
											component='iframe'
											src={`https://www.youtube.com/embed/${introVideoId}?autoplay=1`}
											title='Course Introduction'
											allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
											allowFullScreen
											sx={{
												width: '100%',
												height: '100%',
												border: 'none',
												display: 'block',
											}}
										/>
									) : introVideoId ? (
										/* Cover image with play button overlay */
										<Box
											sx={{
												width: '100%',
												height: '100%',
												position: 'relative',
												cursor: 'pointer',
											}}
											onClick={() => setPlayingIntro(true)}
										>
											<Box
												component='img'
												src={
													course.coverImage ??
													`https://img.youtube.com/vi/${introVideoId}/hqdefault.jpg`
												}
												alt='Course Introduction'
												sx={{
													width: '100%',
													height: '100%',
													objectFit: 'cover',
													display: 'block',
												}}
											/>
											{/* Dark overlay */}
											<Box
												sx={{
													position: 'absolute',
													inset: 0,
													bgcolor: 'rgba(0,0,0,0.35)',
												}}
											/>
											{/* Play button */}
											<Box
												sx={{
													position: 'absolute',
													inset: 0,
													display: 'flex',
													flexDirection: 'column',
													alignItems: 'center',
													justifyContent: 'center',
													gap: 0.75,
												}}
											>
												<PlayCircleOutlinedIcon
													sx={{
														fontSize: 56,
														color: 'white',
														filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))',
													}}
												/>
												<Typography
													variant='caption'
													sx={{
														color: 'white',
														fontWeight: 600,
														letterSpacing: 0.5,
													}}
												>
													Preview this course
												</Typography>
											</Box>
										</Box>
									) : course.coverImage ? (
										<Box
											component='img'
											src={course.coverImage}
											alt={course.title}
											sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
										/>
									) : (
										<Box
											sx={{
												width: '100%',
												height: '100%',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											<SchoolIcon sx={{ fontSize: 64, color: 'grey.600' }} />
										</Box>
									)}
								</Box>

								<Box sx={{ p: 3 }}>
									{/* â”€â”€ Admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
									{isAdmin ? (
										<>
											{!isModerator && (
												<Button
													fullWidth
													variant='contained'
													size='large'
													startIcon={<EditIcon />}
													onClick={() =>
														navigate(`/admin/courses/${course._id}/edit`)
													}
													sx={{ fontWeight: 700, borderRadius: 2 }}
												>
													Edit Course
												</Button>
											)}
											<Button
												fullWidth
												variant='outlined'
												size='large'
												startIcon={<VisibilityOutlinedIcon />}
												onClick={() =>
													navigate(`/admin/courses/${course._id}/learn`)
												}
												sx={{
													fontWeight: 700,
													borderRadius: 2,
													mt: !isModerator ? 1.5 : 0,
												}}
											>
												Student View
											</Button>
											<Box sx={{ mt: 2 }}>
												{[
													{
														icon: <OndemandVideoIcon sx={{ fontSize: 16 }} />,
														text: `${totalLectures} video lecture${totalLectures !== 1 ? 's' : ''}`,
													},
													{
														icon: <AllInclusiveIcon sx={{ fontSize: 16 }} />,
														text: 'Full lifetime access',
													},
													{
														icon: <DevicesIcon sx={{ fontSize: 16 }} />,
														text: 'Access on any device',
													},
													{
														icon: (
															<WorkspacePremiumIcon sx={{ fontSize: 16 }} />
														),
														text: 'Certificate of completion',
													},
													...(course.courseType?.name
														? [
																{
																	icon: <ClassIcon sx={{ fontSize: 16 }} />,
																	text: `Type: ${course.courseType.name}`,
																},
															]
														: []),
													...(course.startDate
														? [
																{
																	icon: (
																		<CalendarTodayIcon sx={{ fontSize: 16 }} />
																	),
																	text: `Starts: ${formatDate(course.startDate)}`,
																},
															]
														: []),
													...(course.endDate
														? [
																{
																	icon: <EventIcon sx={{ fontSize: 16 }} />,
																	text: `Ends: ${formatDate(course.endDate)}`,
																},
															]
														: []),
												].map(({ icon, text }) => (
													<Box
														key={text}
														sx={{
															display: 'flex',
															gap: 1.5,
															alignItems: 'center',
															mb: 1,
														}}
													>
														<Box
															sx={{ color: 'text.secondary', display: 'flex' }}
														>
															{icon}
														</Box>
														<Typography variant='body2'>{text}</Typography>
													</Box>
												))}
											</Box>
										</>
									) : isStudent && isEnrolled ? (
										/* â”€â”€ Already enrolled â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
										<>
											<Button
												fullWidth
												variant='contained'
												size='large'
												color='success'
												startIcon={<SchoolIcon />}
												onClick={() => navigate(`/student/courses/${id}/learn`)}
												sx={{ fontWeight: 700, borderRadius: 2 }}
											>
												Go to this course
											</Button>
											{enrollmentDate && (
												<Typography
													variant='body2'
													color='text.secondary'
													sx={{ mt: 1 }}
												>
													Enrolled on {formatDateTime(enrollmentDate)}
												</Typography>
											)}
											<Box sx={{ mt: 2 }}>
												{[
													{
														icon: <OndemandVideoIcon sx={{ fontSize: 16 }} />,
														text: `${totalLectures} video lecture${totalLectures !== 1 ? 's' : ''}`,
													},
													{
														icon: <AllInclusiveIcon sx={{ fontSize: 16 }} />,
														text: 'Full lifetime access',
													},
													{
														icon: <DevicesIcon sx={{ fontSize: 16 }} />,
														text: 'Access on any device',
													},
													{
														icon: (
															<WorkspacePremiumIcon sx={{ fontSize: 16 }} />
														),
														text: 'Certificate of completion',
													},
												].map(({ icon, text }) => (
													<Box
														key={text}
														sx={{
															display: 'flex',
															gap: 1.5,
															alignItems: 'center',
															mb: 1,
														}}
													>
														<Box
															sx={{ color: 'text.secondary', display: 'flex' }}
														>
															{icon}
														</Box>
														<Typography variant='body2'>{text}</Typography>
													</Box>
												))}
											</Box>
										</>
									) : (
										/* â”€â”€ Not enrolled: radio-option layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
										<>
											{/* â”€â”€ Option A: Subscribe and save (only if course is in sub) */}
											{courseInSub && (
												<Box
													onClick={() => setSelectedOption('subscription')}
													sx={{
														border: '2px solid',
														borderColor:
															selectedOption === 'subscription'
																? '#7c3aed'
																: 'divider',
														borderRadius: 2,
														p: 2,
														mb: 1.5,
														cursor: 'pointer',
														transition: 'border-color 0.15s',
														'&:hover': { borderColor: '#7c3aed' },
													}}
												>
													{/* Header row */}
													<Box
														sx={{
															display: 'flex',
															alignItems: 'flex-start',
															gap: 1.5,
														}}
													>
														{/* Radio dot */}
														<Box
															sx={{
																width: 20,
																height: 20,
																borderRadius: '50%',
																flexShrink: 0,
																mt: 0.25,
																border: '2px solid',
																borderColor:
																	selectedOption === 'subscription'
																		? '#7c3aed'
																		: 'grey.400',
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
															}}
														>
															{selectedOption === 'subscription' && (
																<Box
																	sx={{
																		width: 10,
																		height: 10,
																		borderRadius: '50%',
																		bgcolor: '#7c3aed',
																	}}
																/>
															)}
														</Box>
														<Box>
															<Typography
																variant='body2'
																sx={{ fontWeight: 700 }}
															>
																Subscribe and save
															</Typography>
															{lowestSubPrice < Infinity ? (
																<Typography
																	variant='caption'
																	color='text.secondary'
																>
																	From à§³{lowestSubPrice.toLocaleString()}{' '}
																	/month
																</Typography>
															) : (
																<Typography
																	variant='caption'
																	color='text.secondary'
																>
																	View subscription plans
																</Typography>
															)}
														</Box>
													</Box>

													{/* Expanded content */}
													{selectedOption === 'subscription' && (
														<Box sx={{ mt: 2 }}>
															{userSubCoversThisCourse ? (
																/* Has matching subscription */
																<>
																	<Box
																		sx={{
																			display: 'flex',
																			gap: 1,
																			alignItems: 'flex-start',
																			bgcolor: '#f0fdf4',
																			border: '1px solid #bbf7d0',
																			borderRadius: 1.5,
																			p: 1.5,
																			mb: 2,
																		}}
																	>
																		<VerifiedIcon
																			sx={{
																				color: '#16a34a',
																				fontSize: 18,
																				flexShrink: 0,
																				mt: 0.1,
																			}}
																		/>
																		<Box>
																			<Typography
																				variant='caption'
																				sx={{
																					fontWeight: 700,
																					color: '#166534',
																					display: 'block',
																				}}
																			>
																				Get this course free with your
																				subscription
																			</Typography>
																			<Typography
																				variant='caption'
																				color='text.secondary'
																			>
																				{userActivePlan} plan Â· Expires{' '}
																				{formatDate(userSubExpiry!)}
																				{(planCountMap[userActivePlan!] ?? 0) >
																					0 &&
																					` Â· ${planCountMap[userActivePlan!]} courses included`}
																			</Typography>
																		</Box>
																	</Box>
																	<Button
																		fullWidth
																		variant='contained'
																		size='large'
																		disabled={enrolling}
																		onClick={(e) => {
																			e.stopPropagation();
																			void handleEnroll();
																		}}
																		startIcon={<CardMembershipIcon />}
																		sx={{
																			fontWeight: 700,
																			borderRadius: 2,
																			bgcolor: '#7c3aed',
																			'&:hover': { bgcolor: '#6d28d9' },
																		}}
																	>
																		{enrolling ? (
																			<CircularProgress
																				size={22}
																				color='inherit'
																			/>
																		) : (
																			'Enroll with Subscription'
																		)}
																	</Button>
																</>
															) : userHasWrongPlan ? (
																/* Has a subscription but wrong plan */
																<>
																	<Box
																		sx={{
																			bgcolor: '#fff7ed',
																			border: '1px solid #fed7aa',
																			borderRadius: 1.5,
																			p: 1.5,
																			mb: 2,
																		}}
																	>
																		<Typography
																			variant='caption'
																			sx={{
																				fontWeight: 700,
																				color: '#92400e',
																				display: 'block',
																				mb: 1,
																			}}
																		>
																			Plan upgrade required to enroll free
																		</Typography>
																		<Box
																			sx={{
																				display: 'flex',
																				alignItems: 'center',
																				justifyContent: 'space-between',
																				mb: 0.75,
																			}}
																		>
																			<Typography
																				variant='caption'
																				color='text.secondary'
																			>
																				Your current plan
																			</Typography>
																			<Chip
																				label={userActivePlan}
																				size='small'
																				sx={{
																					bgcolor: '#0284c7',
																					color: 'white',
																					fontWeight: 600,
																					fontSize: '0.7rem',
																				}}
																			/>
																		</Box>
																		<Box
																			sx={{
																				display: 'flex',
																				alignItems: 'center',
																				justifyContent: 'space-between',
																				mb: 0.5,
																			}}
																		>
																			<Typography
																				variant='caption'
																				color='text.secondary'
																			>
																				Required plan
																			</Typography>
																			<Box
																				sx={{
																					display: 'flex',
																					gap: 0.5,
																					flexWrap: 'wrap',
																					justifyContent: 'flex-end',
																				}}
																			>
																				{course.allowedSubscriptionPlans.map(
																					(p) => (
																						<Chip
																							key={p}
																							label={p}
																							size='small'
																							sx={{
																								bgcolor: '#7c3aed',
																								color: 'white',
																								fontWeight: 600,
																								fontSize: '0.7rem',
																							}}
																						/>
																					),
																				)}
																			</Box>
																		</Box>
																		{course.allowedSubscriptionPlans.map(
																			(p) =>
																				(planCountMap[p] ?? 0) > 0 && (
																					<Typography
																						key={p}
																						variant='caption'
																						color='text.secondary'
																						sx={{
																							display: 'block',
																							textAlign: 'right',
																							mb: 0.25,
																						}}
																					>
																						{planCountMap[p]} courses free with{' '}
																						{p}
																					</Typography>
																				),
																		)}
																	</Box>
																	<Button
																		fullWidth
																		variant='outlined'
																		size='medium'
																		component={RouterLink}
																		to='/pricing'
																		onClick={(e) => e.stopPropagation()}
																		startIcon={<CardMembershipIcon />}
																		sx={{
																			fontWeight: 600,
																			borderRadius: 2,
																			color: '#92400e',
																			borderColor: '#f97316',
																			'&:hover': {
																				bgcolor: '#fff7ed',
																				borderColor: '#ea580c',
																			},
																		}}
																	>
																		Upgrade Subscription
																	</Button>
																</>
															) : (
																/* No subscription at all (student or guest) */
																<>
																	<Box
																		sx={{
																			display: 'flex',
																			gap: 1,
																			alignItems: 'flex-start',
																			bgcolor: '#f0fdf4',
																			border: '1px solid #bbf7d0',
																			borderRadius: 1.5,
																			p: 1.5,
																			mb: 1.5,
																		}}
																	>
																		<VerifiedIcon
																			sx={{
																				color: '#16a34a',
																				fontSize: 18,
																				flexShrink: 0,
																				mt: 0.1,
																			}}
																		/>
																		<Typography
																			variant='caption'
																			sx={{ color: '#166534' }}
																		>
																			<strong>Get this course for free</strong>{' '}
																			when you subscribe. Terms apply.
																		</Typography>
																	</Box>
																	{course.allowedSubscriptionPlans.map((p) => {
																		const count = planCountMap[p] ?? 0;
																		return (
																			<Box
																				key={p}
																				sx={{
																					display: 'flex',
																					gap: 1,
																					alignItems: 'center',
																					mb: 0.75,
																				}}
																			>
																				<LocalOfferIcon
																					sx={{
																						fontSize: 15,
																						color: 'text.secondary',
																						flexShrink: 0,
																					}}
																				/>
																				<Typography
																					variant='caption'
																					color='text.secondary'
																				>
																					<strong>{p}</strong> plan
																					{count > 0 &&
																						` Â· access to ${count} course${count !== 1 ? 's' : ''} for free`}
																				</Typography>
																			</Box>
																		);
																	})}
																	<Box
																		sx={{
																			display: 'flex',
																			gap: 1,
																			alignItems: 'center',
																			mb: 0.75,
																		}}
																	>
																		<AllInclusiveIcon
																			sx={{
																				fontSize: 15,
																				color: 'text.secondary',
																			}}
																		/>
																		<Typography
																			variant='caption'
																			color='text.secondary'
																		>
																			Cancel anytime
																		</Typography>
																	</Box>
																	<Button
																		fullWidth
																		variant='contained'
																		size='large'
																		component={RouterLink}
																		to={user ? '/pricing' : '/auth/register'}
																		onClick={(e) => e.stopPropagation()}
																		sx={{
																			fontWeight: 700,
																			borderRadius: 2,
																			mt: 1.5,
																			bgcolor: '#7c3aed',
																			'&:hover': { bgcolor: '#6d28d9' },
																		}}
																	>
																		{user
																			? 'View Subscription Plans'
																			: 'Start Subscription'}
																	</Button>
																</>
															)}
														</Box>
													)}
												</Box>
											)}

											{/* â”€â”€ Option B: Buy / Enroll directly â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
											<Box
												onClick={() =>
													courseInSub && setSelectedOption('direct')
												}
												sx={{
													border: courseInSub ? '2px solid' : 'none',
													borderColor:
														selectedOption === 'direct'
															? 'primary.main'
															: 'divider',
													borderRadius: courseInSub ? 2 : 0,
													p: courseInSub ? 2 : 0,
													cursor: courseInSub ? 'pointer' : 'default',
													transition: 'border-color 0.15s',
													'&:hover': courseInSub
														? { borderColor: 'primary.main' }
														: {},
												}}
											>
												{/* Header row */}
												<Box
													sx={{
														display: 'flex',
														alignItems: 'flex-start',
														gap: courseInSub ? 1.5 : 0,
													}}
												>
													{courseInSub && (
														<Box
															sx={{
																width: 20,
																height: 20,
																borderRadius: '50%',
																flexShrink: 0,
																mt: 0.25,
																border: '2px solid',
																borderColor:
																	selectedOption === 'direct'
																		? 'primary.main'
																		: 'grey.400',
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
															}}
														>
															{selectedOption === 'direct' && (
																<Box
																	sx={{
																		width: 10,
																		height: 10,
																		borderRadius: '50%',
																		bgcolor: 'primary.main',
																	}}
																/>
															)}
														</Box>
													)}
													<Box>
														<Typography
															variant='body2'
															sx={{ fontWeight: 700 }}
														>
															{course.pricing === 'Free'
																? 'Enroll for free'
																: 'Buy this course'}
														</Typography>
														{course.pricing === 'Free' || !priceInfo ? (
															<Typography
																variant='h5'
																sx={{
																	fontWeight: 800,
																	lineHeight: 1.2,
																	mt: 0.25,
																}}
															>
																Free
															</Typography>
														) : (
															<Box sx={{ mt: 0.25 }}>
																<Box
																	sx={{
																		display: 'flex',
																		alignItems: 'baseline',
																		gap: 1,
																		flexWrap: 'wrap',
																	}}
																>
																	<Typography
																		variant='h5'
																		sx={{ fontWeight: 900, lineHeight: 1.2 }}
																	>
																		{formatBdt(priceInfo.discountPrice)}
																	</Typography>
																	{priceInfo.hasDiscount && (
																		<Chip
																			label={`${priceInfo.discountPercent}% off`}
																			size='small'
																			color='success'
																			sx={{
																				height: 24,
																				fontSize: '0.75rem',
																				fontWeight: 800,
																			}}
																		/>
																	)}
																</Box>
																{priceInfo.hasDiscount && (
																	<Typography
																		variant='body2'
																		color='text.secondary'
																		sx={{ mt: 0.5 }}
																	>
																		List price{' '}
																		<Box
																			component='span'
																			sx={{
																				textDecoration: 'line-through',
																				fontWeight: 700,
																			}}
																		>
																			{formatBdt(priceInfo.listPrice)}
																		</Box>{' '}
																		You save{' '}
																		{formatBdt(priceInfo.discountAmount)}
																	</Typography>
																)}
															</Box>
														)}
													</Box>
												</Box>

												{/* Expanded content */}
												{(selectedOption === 'direct' || !courseInSub) && (
													<Box sx={{ mt: courseInSub ? 2 : 1.5 }}>
														{/* Course highlights */}
														{[
															{
																icon: (
																	<WorkspacePremiumIcon sx={{ fontSize: 15 }} />
																),
																text: 'Certificate of completion',
															},
															{
																icon: (
																	<AllInclusiveIcon sx={{ fontSize: 15 }} />
																),
																text: 'Full lifetime access',
															},
															{
																icon: <DevicesIcon sx={{ fontSize: 15 }} />,
																text: 'Access on any device',
															},
														].map(({ icon, text }) => (
															<Box
																key={text}
																sx={{
																	display: 'flex',
																	gap: 1,
																	alignItems: 'center',
																	mb: 0.75,
																}}
															>
																<Box
																	sx={{
																		color: 'text.secondary',
																		display: 'flex',
																	}}
																>
																	{icon}
																</Box>
																<Typography
																	variant='caption'
																	color='text.secondary'
																>
																	{text}
																</Typography>
															</Box>
														))}

														<Box sx={{ mt: 1.5 }}>
															{isStudent ? (
																<Button
																	fullWidth
																	variant='contained'
																	size='large'
																	disabled={enrolling}
																	onClick={(e) => {
																		e.stopPropagation();
																		void handleEnroll();
																	}}
																	sx={{ fontWeight: 700, borderRadius: 2 }}
																>
																	{enrolling ? (
																		<CircularProgress
																			size={22}
																			color='inherit'
																		/>
																	) : course.pricing === 'Free' ? (
																		'Enroll Now â€” Free'
																	) : priceInfo?.hasDiscount ? (
																		`Buy Now - ${formatBdt(priceInfo.discountPrice)}`
																	) : (
																		'Buy Now'
																	)}
																</Button>
															) : (
																<>
																	<Button
																		fullWidth
																		variant='contained'
																		size='large'
																		component={RouterLink}
																		to='/auth/register'
																		onClick={(e) => e.stopPropagation()}
																		sx={{
																			fontWeight: 700,
																			borderRadius: 2,
																			mb: 1,
																		}}
																	>
																		{course.pricing === 'Free'
																			? 'Enroll Free'
																			: 'Get Started'}
																	</Button>
																	<Button
																		fullWidth
																		variant='outlined'
																		size='large'
																		component={RouterLink}
																		to='/auth/login'
																		onClick={(e) => e.stopPropagation()}
																		sx={{ fontWeight: 600, borderRadius: 2 }}
																	>
																		Sign In
																	</Button>
																</>
															)}
														</Box>
													</Box>
												)}
											</Box>

											{/* Video lecture count below options */}
											<Box
												sx={{
													display: 'flex',
													gap: 1,
													alignItems: 'center',
													mt: 2,
												}}
											>
												<OndemandVideoIcon
													sx={{ fontSize: 16, color: 'text.secondary' }}
												/>
												<Typography variant='caption' color='text.secondary'>
													{totalLectures} on-demand video lecture
													{totalLectures !== 1 ? 's' : ''}
												</Typography>
											</Box>
										</>
									)}
								</Box>
							</Paper>
						</Box>
					</Grid>
				</Grid>
			</Container>

			{/* â”€â”€ Free Preview Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
			<AppModal
				open={Boolean(previewLecture)}
				onClose={() => setPreviewLecture(null)}
				maxWidth='md'
				hideActions
				contentDividers={false}
				paperSx={{ borderRadius: 3, overflow: 'hidden', bgcolor: '#0f0f0f' }}
				titleSx={{
					bgcolor: '#1a1a1a',
					color: 'white',
					py: 1.5,
					px: 2.5,
					pr: 6,
				}}
				closeButtonSx={{ color: 'grey.400', '&:hover': { color: 'white' } }}
				contentSx={{
					p: 0,
					display: 'flex',
					flexDirection: { xs: 'column', md: 'row' },
					minHeight: 420,
				}}
				title={
					<Box>
						<Typography
							variant='caption'
							sx={{ color: 'grey.400', display: 'block', mb: 0.25 }}
						>
							Free Preview - {course.title}
						</Typography>
						<Typography
							sx={{
								fontWeight: 700,
								color: 'white',
								fontSize: '1rem',
								lineHeight: 1.3,
							}}
						>
							{previewLecture?.title}
						</Typography>
					</Box>
				}
			>
				{/* Video player */}
				<Box
					sx={{
						flex: 1,
						bgcolor: '#000',
						position: 'relative',
						minHeight: { xs: 240, md: 420 },
					}}
				>
					{previewLecture?.videoUrl && getYouTubeId(previewLecture.videoUrl) ? (
						<Box
							key={previewLecture._id}
							component='iframe'
							src={`https://www.youtube.com/embed/${getYouTubeId(previewLecture.videoUrl)}?autoplay=1`}
							title={previewLecture.title}
							allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
							allowFullScreen
							sx={{
								position: 'absolute',
								inset: 0,
								width: '100%',
								height: '100%',
								border: 'none',
							}}
						/>
					) : (
						<Box
							sx={{
								position: 'absolute',
								inset: 0,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Typography color='grey.500'>No video available</Typography>
						</Box>
					)}
				</Box>

				{/* Sidebar: other preview lectures */}
				{allPreviewLectures.length > 1 && (
					<Box
						sx={{
							width: { xs: '100%', md: 280 },
							bgcolor: '#1a1a1a',
							display: 'flex',
							flexDirection: 'column',
							borderLeft: { md: '1px solid #2a2a2a' },
							borderTop: { xs: '1px solid #2a2a2a', md: 'none' },
							overflow: 'hidden',
						}}
					>
						<Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #2a2a2a' }}>
							<Typography
								variant='caption'
								sx={{
									color: 'grey.400',
									fontWeight: 600,
									textTransform: 'uppercase',
									letterSpacing: 0.5,
								}}
							>
								Free Previews ({allPreviewLectures.length})
							</Typography>
						</Box>
						<List disablePadding sx={{ overflow: 'auto', flex: 1 }}>
							{allPreviewLectures.map((lec) => {
								const isActive = lec._id === previewLecture?._id;
								return (
									<ListItemButton
										key={lec._id}
										selected={isActive}
										onClick={() => setPreviewLecture(lec)}
										sx={{
											px: 2,
											py: 1.25,
											gap: 1.25,
											borderBottom: '1px solid #2a2a2a',
											'&.Mui-selected': { bgcolor: '#7c3aed22' },
											'&.Mui-selected:hover': { bgcolor: '#7c3aed33' },
											'&:hover': { bgcolor: '#ffffff0a' },
										}}
									>
										{isActive ? (
											<PlayCircleFilledIcon
												sx={{ fontSize: 20, color: '#a78bfa', flexShrink: 0 }}
											/>
										) : (
											<PlayCircleOutlinedIcon
												sx={{
													fontSize: 20,
													color: 'grey.500',
													flexShrink: 0,
												}}
											/>
										)}
										<ListItemText
											primary={lec.title}
											slotProps={{
												primary: {
													style: {
														fontSize: '0.82rem',
														fontWeight: isActive ? 700 : 400,
														color: isActive ? '#a78bfa' : '#d1d5db',
														lineHeight: 1.35,
													},
												},
											}}
										/>
									</ListItemButton>
								);
							})}
						</List>
					</Box>
				)}
			</AppModal>
		</Box>
	);
}
