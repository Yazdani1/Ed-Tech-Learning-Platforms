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
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	Grid,
	IconButton,
	List,
	ListItemButton,
	ListItemText,
	Paper,
	Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SchoolIcon from '@mui/icons-material/School';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import DevicesIcon from '@mui/icons-material/Devices';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { courseService } from '../../services/course.service';
import { subscriptionPlanConfigService } from '../../services/subscriptionPlanConfig.service';
import PublicNavbar from '../../components/layout/PublicNavbar';
import {
	formatLectureDuration,
	formatSectionDuration,
} from '../../utils/duration';
import type {
	ICourse,
	ILecture,
	ISubscriptionPlanConfig,
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
	const { user } = useAuth();
	const [course, setCourse] = useState<ICourse | null>(null);
	const [loading, setLoading] = useState(true);
	const [expandAll, setExpandAll] = useState(false);
	const [isEnrolled, setIsEnrolled] = useState(false);
	const [enrolling, setEnrolling] = useState(false);
	const [subPlans, setSubPlans] = useState<ISubscriptionPlanConfig[]>([]);
	const [selectedOption, setSelectedOption] = useState<
		'subscription' | 'direct'
	>('direct');
	const [playingIntro, setPlayingIntro] = useState(false);
	const [previewLecture, setPreviewLecture] = useState<ILecture | null>(null);

	const isAdmin =
		user && (ADMIN_ROLES as readonly string[]).includes(user.role);
	const isStudent = user?.role === 'Student';

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

	useEffect(() => {
		if (!id) return;
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
	}, [id, user, navigate]);

	useEffect(() => {
		if (!id || !isStudent) return;
		courseService
			.checkEnrollment(id)
			.then((r) => {
				setIsEnrolled(r.data?.isEnrolled ?? false);
			})
			.catch(() => {
				/* not enrolled */
			});
	}, [id, isStudent]);

	useEffect(() => {
		subscriptionPlanConfigService
			.getAll()
			.then((r) => setSubPlans(r.data ?? []));
	}, []);

	const handleEnroll = async () => {
		if (!id) return;
		setEnrolling(true);
		try {
			await courseService.enroll(id);
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

	// All free-preview lectures that have a video
	const allPreviewLectures: ILecture[] = (course.sections ?? []).flatMap((s) =>
		s.lectures.filter((l) => l.isPreview && l.videoUrl),
	);

	return (
		<Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
			<PublicNavbar />

			{/* ── Dark hero ──────────────────────────────────────────── */}
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
											›
										</Typography>
										<Typography variant='caption' sx={{ color: '#a78bfa' }}>
											{course.category.name}
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
											? `BDT ${course.price ?? ''}`
											: 'Free'
									}
									size='small'
									sx={{
										bgcolor: course.pricing === 'Free' ? '#0284c7' : '#d97706',
										color: 'white',
										fontWeight: 600,
									}}
								/>
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

			{/* ── Body ────────────────────────────────────────────────── */}
			<Container maxWidth='lg' sx={{ py: { xs: 4, md: 6 } }}>
				<Grid container spacing={4} sx={{ alignItems: 'flex-start' }}>
					{/* ── Left column ──────────────────────────────────────── */}
					<Grid size={{ xs: 12, md: 8 }}>
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
						{course.sections?.length > 0 && (
							<Box sx={{ mb: 4 }}>
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
									<Button
										size='small'
										onClick={() => setExpandAll((p) => !p)}
										sx={{ color: 'primary.main', fontWeight: 600 }}
									>
										{expandAll
											? 'Collapse all sections'
											: 'Expand all sections'}
									</Button>
								</Box>

								<Typography
									variant='body2'
									color='text.secondary'
									sx={{ mb: 2 }}
								>
									{course.sections.length} sections • {totalLectures} lectures
								</Typography>

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
											expanded={expandAll}
											onChange={() => setExpandAll((p) => !p)}
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
														<Typography variant='body2' color='text.secondary'>
															No lectures yet.
														</Typography>
													</Box>
												)}
											</AccordionDetails>
										</Accordion>
									))}
								</Box>
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

					{/* ── Right sticky card ────────────────────────────────── */}
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
										/* Thumbnail with play button overlay */
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
												src={`https://img.youtube.com/vi/${introVideoId}/hqdefault.jpg`}
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
									{/* ── Admin ──────────────────────────────────────── */}
									{isAdmin ? (
										<>
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
									) : isStudent && isEnrolled ? (
										/* ── Already enrolled ──────────────────────────── */
										<>
											<Button
												fullWidth
												variant='contained'
												size='large'
												color='success'
												startIcon={<CheckIcon />}
												disabled
												sx={{ fontWeight: 700, borderRadius: 2 }}
											>
												Enrolled
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
										/* ── Not enrolled: radio-option layout ─────────── */
										<>
											{/* ── Option A: Subscribe and save (only if course is in sub) */}
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
																	From ৳{lowestSubPrice.toLocaleString()} /month
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
																				{userActivePlan} plan · Expires{' '}
																				{new Date(
																					userSubExpiry!,
																				).toLocaleDateString()}
																				{(planCountMap[userActivePlan!] ?? 0) >
																					0 &&
																					` · ${planCountMap[userActivePlan!]} courses included`}
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
																						` · access to ${count} course${count !== 1 ? 's' : ''} for free`}
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

											{/* ── Option B: Buy / Enroll directly ────────── */}
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
														<Typography
															variant='h5'
															sx={{
																fontWeight: 800,
																lineHeight: 1.2,
																mt: 0.25,
															}}
														>
															{course.pricing === 'Free'
																? 'Free'
																: `৳${course.price?.toLocaleString() ?? ''}`}
														</Typography>
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
																		'Enroll Now — Free'
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

			{/* ── Free Preview Modal ─────────────────────────────────── */}
			<Dialog
				open={Boolean(previewLecture)}
				onClose={() => setPreviewLecture(null)}
				maxWidth='md'
				fullWidth
				PaperProps={{
					sx: { borderRadius: 3, overflow: 'hidden', bgcolor: '#0f0f0f' },
				}}
			>
				<DialogTitle
					sx={{
						bgcolor: '#1a1a1a',
						color: 'white',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						py: 1.5,
						px: 2.5,
					}}
				>
					<Box>
						<Typography
							variant='caption'
							sx={{ color: 'grey.400', display: 'block', mb: 0.25 }}
						>
							Free Preview — {course.title}
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
					<IconButton
						onClick={() => setPreviewLecture(null)}
						sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}
					>
						<CloseIcon />
					</IconButton>
				</DialogTitle>

				<DialogContent
					sx={{
						p: 0,
						display: 'flex',
						flexDirection: { xs: 'column', md: 'row' },
						minHeight: 420,
					}}
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
						{previewLecture?.videoUrl &&
						getYouTubeId(previewLecture.videoUrl) ? (
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
				</DialogContent>
			</Dialog>
		</Box>
	);
}
