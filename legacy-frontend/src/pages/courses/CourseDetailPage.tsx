import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Container,
	Divider,
	Grid,
	Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import EventIcon from '@mui/icons-material/Event';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import DevicesIcon from '@mui/icons-material/Devices';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { courseService } from '../../services/course.service';
import { studyCurriculumService } from '../../services/studyCurriculum.service';
import { subscriptionPlanConfigService } from '../../services/subscriptionPlanConfig.service';
import { quizBankService } from '../../services/quizBank.service';
import PublicNavbar from '../../components/layout/PublicNavbar';
import type {
	ICourse,
	ILecture,
	IStudyCurriculum,
	ISubscriptionPlanConfig,
	IPublicQuizSection,
} from '../../types/index';
import { useAuth } from '../../context/useAuth';
import CourseDetailHeroSection from './detail/CourseDetailHeroSection';
import CourseTypeScheduleCard from './detail/CourseTypeScheduleCard';
import CourseContentAccordionTabs from './detail/CourseContentAccordionTabs';
import CourseEnrollmentCard from './detail/CourseEnrollmentCard';
import CoursePreviewLectureModal from './detail/CoursePreviewLectureModal';

const ADMIN_ROLES = ['Super Admin', 'Admin', 'Moderator'] as const;

const CARD_PALETTE = [
	{ cardBg: '#e8f4fd', photoBg: '#bbdefb', accent: '#1565c0' },
	{ cardBg: '#f3e8fd', photoBg: '#e1bee7', accent: '#6a1b9a' },
	{ cardBg: '#e8fdf0', photoBg: '#c8e6c9', accent: '#2e7d32' },
	{ cardBg: '#fdf6e8', photoBg: '#ffe0b2', accent: '#e65100' },
	{ cardBg: '#fde8e8', photoBg: '#ffcdd2', accent: '#c62828' },
	{ cardBg: '#e8fdfd', photoBg: '#b2ebf2', accent: '#00695c' },
];

const CourseDetailPage = () => {
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
	const [selectedOption, setSelectedOption] = useState<'subscription' | 'direct'>('direct');
	const [playingIntro, setPlayingIntro] = useState(false);
	const [previewLecture, setPreviewLecture] = useState<ILecture | null>(null);

	const isAdmin = user && (ADMIN_ROLES as readonly string[]).includes(user.role);
	const isStudent = user?.role === 'Student';
	const isModerator = user?.role === 'Moderator';
	const userActivePlan = user?.activeSubscription?.plan;
	const userSubExpiry = user?.activeSubscription?.endDate;

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
				course?.pricing === 'Paid' && selectedOption === 'direct' ? 'paid' : undefined,
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
	const hasStudyCurriculum = studyCurricula.length > 0;

	const getSectionDuration = (section: (typeof course.sections)[0]) =>
		section.lectures.reduce((total, lec) => total + (lec.duration ?? 0), 0);

	const introLecture = (() => {
		for (const section of course.sections ?? []) {
			for (const lec of section.lectures) {
				if (lec.title.toLowerCase().includes('course introduction') && lec.videoUrl)
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

	const introVideoId = introLecture ? getYouTubeId(introLecture.videoUrl!) : null;
	const allPreviewLectures: ILecture[] = (course.sections ?? []).flatMap((s) =>
		s.lectures.filter((l) => l.isPreview && l.videoUrl),
	);

	return (
		<Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
			<PublicNavbar />

			<CourseDetailHeroSection course={course} />

			<Container maxWidth='lg' sx={{ py: { xs: 4, md: 6 } }}>
				<Grid container spacing={4} sx={{ alignItems: 'flex-start' }}>
					<Grid size={{ xs: 12, md: 8 }}>
						<CourseTypeScheduleCard course={course} />

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
											<Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
												<CheckIcon
													sx={{ fontSize: 18, color: 'success.main', mt: 0.25, flexShrink: 0 }}
												/>
												<Typography variant='body2'>{item}</Typography>
											</Box>
										</Grid>
									))}
								</Grid>
							</Box>
						)}

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
									{ icon: <AllInclusiveIcon fontSize='small' />, text: 'Full lifetime access' },
									{ icon: <DevicesIcon fontSize='small' />, text: 'Access on all devices' },
									{
										icon: <WorkspacePremiumIcon fontSize='small' />,
										text: 'Certificate of completion',
									},
								].map(({ icon, text }) => (
									<Grid key={text} size={{ xs: 12, sm: 6 }}>
										<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
											<Box sx={{ color: 'text.secondary' }}>{icon}</Box>
											<Typography variant='body2'>{text}</Typography>
										</Box>
									</Grid>
								))}
							</Grid>
						</Box>

						<Divider sx={{ mb: 4 }} />

						<CourseContentAccordionTabs
							course={course}
							contentView={contentView}
							setContentView={setContentView}
							expanded={expanded}
							setExpanded={setExpanded}
							liveExpanded={liveExpanded}
							setLiveExpanded={setLiveExpanded}
							studyCurricula={studyCurricula}
							quizSections={quizSections}
							getSectionDuration={getSectionDuration}
							setPreviewLecture={setPreviewLecture}
						/>

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

						{course.description && (
							<Box sx={{ mb: 4 }}>
								<Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
									About this course
								</Typography>
								<Box
									dangerouslySetInnerHTML={{ __html: course.description }}
									sx={{ '& p': { mt: 0, mb: 1.5 }, '& ul': { pl: 3 }, lineHeight: 1.8 }}
								/>
							</Box>
						)}

						<Divider sx={{ mb: 4 }} />

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
															sx={{ width: 88, height: 88, fontSize: 32, bgcolor: palette.accent }}
														>
															{teacher.name.charAt(0)}
														</Avatar>
													</Box>

													<Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 0.5 }}>
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

					<CourseEnrollmentCard
						course={course}
						isEnrolled={isEnrolled}
						enrollmentDate={enrollmentDate}
						enrolling={enrolling}
						subPlans={subPlans}
						selectedOption={selectedOption}
						setSelectedOption={setSelectedOption}
						playingIntro={playingIntro}
						setPlayingIntro={setPlayingIntro}
						introVideoId={introVideoId}
						isStudent={!!isStudent}
						isAdmin={!!isAdmin}
						isModerator={!!isModerator}
						handleEnroll={handleEnroll}
						totalLectures={totalLectures}
						userActivePlan={userActivePlan}
						userSubExpiry={userSubExpiry}
						isAuthenticated={!!user}
					/>
				</Grid>
			</Container>

			<CoursePreviewLectureModal
				previewLecture={previewLecture}
				setPreviewLecture={setPreviewLecture}
				allPreviewLectures={allPreviewLectures}
				courseTitle={course.title}
			/>
		</Box>
	);
};

export default CourseDetailPage;
