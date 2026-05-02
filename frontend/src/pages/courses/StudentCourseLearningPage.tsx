import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Avatar,
	Box,
	Chip,
	CircularProgress,
	Divider,
	Grid,
	IconButton,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Tooltip,
	Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import { courseService } from '../../services/course.service';
import { enrollmentService } from '../../services/enrollment.service';
import { formatLectureDuration, formatSectionDuration } from '../../utils/duration';
import type { ICourse, ILecture } from '../../types/index';
import StudentSidebar from '../../components/layout/StudentLayout/StudentSidebar';

type NavSection = 'course_overview' | 'video_lectures' | 'teacher' | 'announcements' | 'study_materials' | 'qa';

const getYouTubeId = (url: string) => {
	const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
	return m ? m[1] : null;
};

const NAV_ITEMS: { key: NavSection; label: string; icon: React.ReactNode }[] = [
	{ key: 'course_overview', label: 'Course Overview', icon: <InfoOutlinedIcon /> },
	{ key: 'video_lectures', label: 'Video Lectures', icon: <PlayCircleOutlinedIcon /> },
	{ key: 'teacher', label: 'Teacher', icon: <PersonOutlinedIcon /> },
	{ key: 'announcements', label: 'Announcements', icon: <CampaignOutlinedIcon /> },
	{ key: 'study_materials', label: 'Study Materials', icon: <MenuBookOutlinedIcon /> },
	{ key: 'qa', label: 'Q & A', icon: <QuestionAnswerOutlinedIcon /> },
];

export default function StudentCourseLearningPage() {
	const { courseId } = useParams<{ courseId: string }>();
	const navigate = useNavigate();
	const [course, setCourse] = useState<ICourse | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeNav, setActiveNav] = useState<NavSection>('video_lectures');
	const [activeLecture, setActiveLecture] = useState<ILecture | null>(null);
	const [enrolledCount, setEnrolledCount] = useState<number | null>(null);

	useEffect(() => {
		if (!courseId) return;
		courseService
			.getById(courseId)
			.then((r) => {
				setCourse(r.data);
				const first = r.data?.sections?.flatMap((s) => s.lectures).find((l) => l.videoUrl);
				if (first) setActiveLecture(first);
			})
			.finally(() => setLoading(false));

		enrollmentService
			.getCourseCount(courseId)
			.then((r) => setEnrolledCount(r.data?.count ?? null))
			.catch(() => {});
	}, [courseId]);

	const videoId = activeLecture?.videoUrl ? getYouTubeId(activeLecture.videoUrl) : null;
	const totalLectures = course?.sections?.reduce((a, s) => a + s.lectures.length, 0) ?? 0;
	const totalDurationSec =
		course?.sections?.reduce((a, s) => a + s.lectures.reduce((b, l) => b + (l.duration ?? 0), 0), 0) ?? 0;

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
				<CircularProgress />
			</Box>
		);
	}

	if (!course) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
				<Typography color='text.secondary'>Course not found.</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
			{/* ── Main student sidebar ────────────────────────────────── */}
			<StudentSidebar />

			{/* ── Learning area ───────────────────────────────────────── */}
			<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
				{/* Top bar */}
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 1.5,
						px: 2,
						py: 1,
						bgcolor: 'background.paper',
						borderBottom: '1px solid',
						borderColor: 'divider',
						flexShrink: 0,
						minHeight: 56,
					}}
				>
					<Tooltip title='Back to My Courses'>
						<IconButton size='small' onClick={() => navigate('/student/courses')}>
							<ArrowBackIcon fontSize='small' />
						</IconButton>
					</Tooltip>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Typography
							variant='subtitle1'
							sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}
						>
							{course.title}
						</Typography>
						{activeNav === 'video_lectures' && activeLecture && (
							<Typography variant='caption' color='text.secondary' noWrap sx={{ display: 'block' }}>
								{activeLecture.title}
							</Typography>
						)}
					</Box>
				</Box>

				{/* Body: left nav + center + right */}
				<Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
					{/* ── Left nav ──────────────────────────────────────── */}
					<Box
						sx={{
							width: 220,
							bgcolor: 'background.paper',
							borderRight: '1px solid',
							borderColor: 'divider',
							flexShrink: 0,
							overflowY: 'auto',
							pt: 1,
						}}
					>
						<List disablePadding>
							{NAV_ITEMS.map((item) => {
								const active = activeNav === item.key;
								return (
									<ListItemButton
										key={item.key}
										onClick={() => setActiveNav(item.key)}
										selected={active}
										sx={{
											mx: 1,
											my: 0.25,
											borderRadius: 1.5,
											'&.Mui-selected': { bgcolor: 'primary.50', color: 'primary.main' },
											'&.Mui-selected:hover': { bgcolor: 'primary.100' },
										}}
									>
										<ListItemIcon
											sx={{
												minWidth: 36,
												color: active ? 'primary.main' : 'text.secondary',
											}}
										>
											{item.icon}
										</ListItemIcon>
										<ListItemText
											primary={item.label}
											slotProps={{
												primary: {
													style: {
														fontSize: '0.85rem',
														fontWeight: active ? 700 : 400,
													},
												},
											}}
										/>
									</ListItemButton>
								);
							})}
						</List>
					</Box>

					{/* ── Center content ────────────────────────────────── */}
					<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', minWidth: 0 }}>
						{/* ── Video Lectures ─────────────────────────────── */}
						{activeNav === 'video_lectures' && (
							<>
								<Box
									sx={{
										width: '100%',
										aspectRatio: '16/9',
										bgcolor: '#000',
										flexShrink: 0,
										position: 'relative',
									}}
								>
									{videoId ? (
										<Box
											key={activeLecture?._id}
											component='iframe'
											src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
											title={activeLecture?.title ?? 'Lecture'}
											allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
											allowFullScreen
											sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
										/>
									) : (
										<Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
											<Typography color='grey.500'>
												{activeLecture ? 'No video available for this lecture' : 'Select a lecture to start watching'}
											</Typography>
										</Box>
									)}
								</Box>

								{activeLecture && (
									<Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
										<Typography variant='h6' sx={{ fontWeight: 700, mb: 0.5 }}>
											{activeLecture.title}
										</Typography>
										{activeLecture.description && (
											<Typography variant='body2' color='text.secondary'>
												{activeLecture.description}
											</Typography>
										)}
										{activeLecture.duration != null && (
											<Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
												Duration: {formatLectureDuration(activeLecture.duration)}
											</Typography>
										)}
									</Box>
								)}
							</>
						)}

						{/* ── Course Overview ────────────────────────────── */}
						{activeNav === 'course_overview' && (
							<Box sx={{ p: { xs: 3, md: 4 }, maxWidth: 860 }}>
								<Typography variant='h4' sx={{ fontWeight: 800, mb: 0.75, lineHeight: 1.25 }}>
									{course.title}
								</Typography>
								{course.subtitle && (
									<Typography variant='h6' sx={{ fontWeight: 400, color: 'text.secondary', mb: 2 }}>
										{course.subtitle}
									</Typography>
								)}
								{course.category?.name && (
									<Box sx={{ mb: 3 }}>
										<Chip
											icon={<CategoryOutlinedIcon sx={{ fontSize: 15 }} />}
											label={course.category.name}
											size='small'
											sx={{ fontWeight: 600 }}
										/>
									</Box>
								)}

								{/* Stats strip */}
								<Box
									sx={{
										display: 'flex',
										flexWrap: 'wrap',
										gap: 3,
										mb: 4,
										p: 2.5,
										bgcolor: 'grey.50',
										border: '1px solid',
										borderColor: 'divider',
										borderRadius: 2,
									}}
								>
									<StatItem
										icon={<PeopleOutlinedIcon />}
										label='Enrolled Students'
										value={enrolledCount !== null ? enrolledCount.toLocaleString() : '—'}
									/>
									<StatItem
										icon={<OndemandVideoIcon />}
										label='Video Lectures'
										value={String(totalLectures)}
									/>
									<StatItem
										icon={<AccessTimeIcon />}
										label='Total Duration'
										value={totalDurationSec > 0 ? formatSectionDuration(totalDurationSec) : '—'}
									/>
									<StatItem
										icon={<MenuBookOutlinedIcon />}
										label='Sections'
										value={String(course.sections?.length ?? 0)}
									/>
								</Box>

								<Divider sx={{ mb: 4 }} />

								{(course.whatYouWillLearn?.length ?? 0) > 0 && (
									<Box sx={{ mb: 4 }}>
										<Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
											What you&apos;ll learn
										</Typography>
										<Grid container spacing={1}>
											{course.whatYouWillLearn.map((item, i) => (
												<Grid key={i} size={{ xs: 12, sm: 6 }}>
													<Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
														<CheckCircleOutlinedIcon
															sx={{ color: 'success.main', fontSize: 18, flexShrink: 0, mt: 0.2 }}
														/>
														<Typography variant='body2'>{item}</Typography>
													</Box>
												</Grid>
											))}
										</Grid>
									</Box>
								)}

								{(course.requirements?.length ?? 0) > 0 && (
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
									<Box>
										<Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
											About this course
										</Typography>
										<Box
											dangerouslySetInnerHTML={{ __html: course.description }}
											sx={{ '& p': { mt: 0, mb: 1.5 }, '& ul': { pl: 3 }, lineHeight: 1.8, color: 'text.secondary' }}
										/>
									</Box>
								)}
							</Box>
						)}

						{/* ── Teacher ────────────────────────────────────── */}
						{activeNav === 'teacher' && (
							<Box sx={{ p: { xs: 3, md: 4 }, maxWidth: 860 }}>
								<Typography variant='h5' sx={{ fontWeight: 700, mb: 1 }}>
									Your Instructor{(course.teachers?.length ?? 0) > 1 ? 's' : ''}
								</Typography>
								<Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
									{course.teachers?.length ?? 0} instructor{(course.teachers?.length ?? 0) !== 1 ? 's' : ''} teaching this course
								</Typography>

								{(course.teachers?.length ?? 0) === 0 ? (
									<Typography color='text.secondary'>No instructors listed for this course.</Typography>
								) : (
									<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
										{course.teachers.map((teacher) => (
											<Box
												key={teacher._id}
												sx={{
													display: 'flex',
													gap: 3,
													p: 3,
													border: '1px solid',
													borderColor: 'divider',
													borderRadius: 2,
													alignItems: 'flex-start',
													bgcolor: 'background.paper',
												}}
											>
												{/* Avatar */}
												<Avatar
													src={teacher.profileImage}
													alt={teacher.name}
													sx={{ width: 72, height: 72, fontSize: 28, bgcolor: 'primary.main', flexShrink: 0 }}
												>
													{teacher.name.charAt(0).toUpperCase()}
												</Avatar>

												{/* Info */}
												<Box sx={{ flex: 1, minWidth: 0 }}>
													<Typography variant='h6' sx={{ fontWeight: 700, mb: 0.5 }}>
														{teacher.name}
													</Typography>

													{teacher.expertise?.length > 0 && (
														<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
															{teacher.expertise.map((exp) => (
																<Chip
																	key={exp}
																	label={exp}
																	size='small'
																	variant='outlined'
																	sx={{ fontSize: '0.72rem' }}
																/>
															))}
														</Box>
													)}

													{teacher.bio && (
														<Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.7 }}>
															{teacher.bio}
														</Typography>
													)}

													{/* Social links */}
													{teacher.socialLinks && Object.values(teacher.socialLinks).some(Boolean) && (
														<Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, flexWrap: 'wrap' }}>
															{teacher.socialLinks.website && (
																<Typography
																	component='a'
																	href={teacher.socialLinks.website}
																	target='_blank'
																	rel='noopener noreferrer'
																	variant='caption'
																	sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
																>
																	Website
																</Typography>
															)}
															{teacher.socialLinks.linkedin && (
																<Typography
																	component='a'
																	href={teacher.socialLinks.linkedin}
																	target='_blank'
																	rel='noopener noreferrer'
																	variant='caption'
																	sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
																>
																	LinkedIn
																</Typography>
															)}
															{teacher.socialLinks.twitter && (
																<Typography
																	component='a'
																	href={teacher.socialLinks.twitter}
																	target='_blank'
																	rel='noopener noreferrer'
																	variant='caption'
																	sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
																>
																	Twitter
																</Typography>
															)}
															{teacher.socialLinks.youtube && (
																<Typography
																	component='a'
																	href={teacher.socialLinks.youtube}
																	target='_blank'
																	rel='noopener noreferrer'
																	variant='caption'
																	sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
																>
																	YouTube
																</Typography>
															)}
														</Box>
													)}
												</Box>
											</Box>
										))}
									</Box>
								)}
							</Box>
						)}

						{/* ── Announcements ──────────────────────────────── */}
						{activeNav === 'announcements' && (
							<Box sx={{ p: 4 }}>
								<Typography variant='h5' sx={{ fontWeight: 700, mb: 2 }}>
									Announcements
								</Typography>
								<Typography color='text.secondary'>No announcements yet.</Typography>
							</Box>
						)}

						{/* ── Study Materials ────────────────────────────── */}
						{activeNav === 'study_materials' && (
							<Box sx={{ p: 4 }}>
								<Typography variant='h5' sx={{ fontWeight: 700, mb: 2 }}>
									Study Materials
								</Typography>
								<Typography color='text.secondary'>No study materials available.</Typography>
							</Box>
						)}

						{/* ── Q & A ──────────────────────────────────────── */}
						{activeNav === 'qa' && (
							<Box sx={{ p: 4 }}>
								<Typography variant='h5' sx={{ fontWeight: 700, mb: 2 }}>
									Q &amp; A
								</Typography>
								<Typography color='text.secondary'>No questions yet.</Typography>
							</Box>
						)}
					</Box>

					{/* ── Right lecture list (Video Lectures only) ──────── */}
					{activeNav === 'video_lectures' && (
						<Box
							sx={{
								width: 320,
								bgcolor: 'grey.50',
								borderLeft: '1px solid',
								borderColor: 'divider',
								overflow: 'auto',
								flexShrink: 0,
							}}
						>
							<Box
								sx={{
									px: 2,
									py: 1.5,
									borderBottom: '1px solid',
									borderColor: 'divider',
									bgcolor: 'background.paper',
									position: 'sticky',
									top: 0,
									zIndex: 1,
								}}
							>
								<Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
									Course Content
								</Typography>
								<Typography variant='caption' color='text.secondary'>
									{course.sections?.length ?? 0} section{(course.sections?.length ?? 0) !== 1 ? 's' : ''} &bull;{' '}
									{totalLectures} lecture{totalLectures !== 1 ? 's' : ''}
								</Typography>
							</Box>

							{(course.sections ?? []).map((section, si) => (
								<Accordion
									key={section._id}
									defaultExpanded={si === 0}
									elevation={0}
									disableGutters
									sx={{
										bgcolor: 'transparent',
										borderBottom: '1px solid',
										borderColor: 'divider',
										'&::before': { display: 'none' },
									}}
								>
									<AccordionSummary
										expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
										sx={{ px: 2, py: 1, bgcolor: 'grey.100', minHeight: 48 }}
									>
										<Box>
											<Typography sx={{ fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.3 }}>
												{section.title}
											</Typography>
											<Typography variant='caption' color='text.secondary'>
												{section.lectures.length} lecture{section.lectures.length !== 1 ? 's' : ''}
											</Typography>
										</Box>
									</AccordionSummary>
									<AccordionDetails sx={{ p: 0 }}>
										{section.lectures.map((lecture, li) => {
											const isActive = activeLecture?._id === lecture._id;
											const hasVideo = !!lecture.videoUrl;
											return (
												<Box
													key={lecture._id}
													onClick={() => { if (hasVideo) setActiveLecture(lecture); }}
													sx={{
														display: 'flex',
														alignItems: 'flex-start',
														gap: 1.25,
														px: 2,
														py: 1.25,
														cursor: hasVideo ? 'pointer' : 'default',
														borderTop: li > 0 ? '1px solid' : 'none',
														borderColor: 'divider',
														bgcolor: isActive ? 'primary.50' : 'background.paper',
														transition: 'background 0.15s',
														...(hasVideo && !isActive && { '&:hover': { bgcolor: 'action.hover' } }),
													}}
												>
													{isActive ? (
														<PlayCircleFilledIcon
															sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0, mt: 0.15 }}
														/>
													) : (
														<PlayCircleOutlinedIcon
															sx={{
																fontSize: 18,
																color: hasVideo ? 'text.secondary' : 'grey.300',
																flexShrink: 0,
																mt: 0.15,
															}}
														/>
													)}
													<Box sx={{ flex: 1, minWidth: 0 }}>
														<Typography
															sx={{
																fontSize: '0.8rem',
																fontWeight: isActive ? 700 : 400,
																color: isActive ? 'primary.main' : hasVideo ? 'text.primary' : 'text.disabled',
																lineHeight: 1.35,
																overflow: 'hidden',
																textOverflow: 'ellipsis',
																display: '-webkit-box',
																WebkitLineClamp: 2,
																WebkitBoxOrient: 'vertical',
															}}
														>
															{lecture.title}
														</Typography>
														{lecture.duration != null && (
															<Typography variant='caption' color='text.secondary'>
																{formatLectureDuration(lecture.duration)}
															</Typography>
														)}
													</Box>
												</Box>
											);
										})}
										{section.lectures.length === 0 && (
											<Box sx={{ px: 2, py: 1.5 }}>
												<Typography variant='caption' color='text.secondary'>
													No lectures in this section.
												</Typography>
											</Box>
										)}
									</AccordionDetails>
								</Accordion>
							))}
						</Box>
					)}
				</Box>
			</Box>
		</Box>
	);
}

// ── Stat card ─────────────────────────────────────────────────
function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
	return (
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
			<Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
			<Box>
				<Typography sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.15 }}>{value}</Typography>
				<Typography variant='caption' color='text.secondary'>
					{label}
				</Typography>
			</Box>
		</Box>
	);
}
