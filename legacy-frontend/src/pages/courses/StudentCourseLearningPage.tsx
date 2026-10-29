import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
	Box,
	CircularProgress,
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
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import toast from 'react-hot-toast';
import { courseService } from '../../services/course.service';
import { enrollmentService } from '../../services/enrollment.service';
import { announcementService } from '../../services/announcement.service';
import { studyCurriculumService } from '../../services/studyCurriculum.service';
import { studyMaterialService } from '../../services/studyMaterial.service';
import { qaService } from '../../services/qa.service';
import type {
	ICourse,
	ILecture,
	IAnnouncement,
	IStudyCurriculum,
	IStudyCurriculumLecture,
	IStudyMaterial,
	ICourseStudentEnrollment,
} from '../../types/index';
import CourseQASection from '../../components/course/CourseQASection';
import StudentSidebar from '../../components/layout/StudentLayout/StudentSidebar';
import ChatWidget from '../../components/chat/ChatWidget';
import StudentChatPage from '../chat/StudentChatPage';
import QuizBankTab from '../../components/course/QuizBankTab';
import { useAuth } from '../../context/useAuth';
import { useConfirmModal } from '../../context/ConfirmModalContext';
import CourseLearningCourseOverview from './learning/CourseLearningCourseOverview';
import CourseLearningTeacherTab from './learning/CourseLearningTeacherTab';
import CourseLearningAnnouncementsTab from './learning/CourseLearningAnnouncementsTab';
import CourseLearningLiveClassTab from './learning/CourseLearningLiveClassTab';
import CourseLearningStudyMaterialsTab from './learning/CourseLearningStudyMaterialsTab';
import CourseLearningStudentsTab from './learning/CourseLearningStudentsTab';
import CourseLearningLectureSidebar from './learning/CourseLearningLectureSidebar';
import LearningVideoPlayer from './learning/LearningVideoPlayer';

type NavSection =
	| 'course_overview'
	| 'video_lectures'
	| 'live_class'
	| 'teacher'
	| 'announcements'
	| 'study_materials'
	| 'students'
	| 'qa'
	| 'quiz_bank'
	| 'support_chat';

const blankCurriculumLecture = (): IStudyCurriculumLecture => ({
	title: '',
	description: '',
	day: '',
	time: '',
});

const blankCurriculumForm = () => ({
	title: '',
	description: '',
	weekName: '',
	lectures: [blankCurriculumLecture()],
});

const NAV_ITEMS: { key: NavSection; label: string; icon: React.ReactNode }[] = [
	{
		key: 'course_overview',
		label: 'Course Overview',
		icon: <InfoOutlinedIcon />,
	},
	{
		key: 'video_lectures',
		label: 'Video Lectures',
		icon: <PlayCircleOutlinedIcon />,
	},
	{
		key: 'live_class',
		label: 'Live Class',
		icon: <EventNoteOutlinedIcon />,
	},
	{ key: 'teacher', label: 'Teacher', icon: <PersonOutlinedIcon /> },
	{
		key: 'announcements',
		label: 'Announcements',
		icon: <CampaignOutlinedIcon />,
	},
	{
		key: 'study_materials',
		label: 'Study Materials',
		icon: <MenuBookOutlinedIcon />,
	},
	{ key: 'students', label: 'Students', icon: <PeopleOutlinedIcon /> },
	{ key: 'qa', label: 'Q & A', icon: <QuestionAnswerOutlinedIcon /> },
	{ key: 'quiz_bank', label: 'Quiz Bank', icon: <QuizOutlinedIcon /> },
	{ key: 'support_chat', label: 'Support Chat', icon: <SupportAgentIcon /> },
];

const StudentCourseLearningPage = () => {
	const { courseId } = useParams<{ courseId: string }>();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { user } = useAuth();
	const { confirm } = useConfirmModal();
	const [course, setCourse] = useState<ICourse | null>(null);
	const [loading, setLoading] = useState(true);
	const initialQuestionId = searchParams.get('questionId');
	const [activeNav, setActiveNav] = useState<NavSection>(
		initialQuestionId ? 'qa' : 'video_lectures',
	);
	const [activeLecture, setActiveLecture] = useState<ILecture | null>(null);
	const [enrolledCount, setEnrolledCount] = useState<number | null>(null);
	const [courseStudents, setCourseStudents] = useState<ICourseStudentEnrollment[]>([]);
	const [studentsLoading, setStudentsLoading] = useState(false);
	const [studentsExporting, setStudentsExporting] = useState(false);
	const [studentsPage, setStudentsPage] = useState(1);
	const STUDENTS_PAGE_SIZE = 15;
	const [qaCount, setQaCount] = useState<number>(0);

	const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
	const [annPosting, setAnnPosting] = useState(false);
	const [showAnnForm, setShowAnnForm] = useState(false);
	const [annForm, setAnnForm] = useState({ title: '', description: '' });
	const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
	const [editingAnnForm, setEditingAnnForm] = useState({ title: '', description: '' });
	const [annUpdating, setAnnUpdating] = useState(false);

	const [studyCurricula, setStudyCurricula] = useState<IStudyCurriculum[]>([]);
	const [scPosting, setScPosting] = useState(false);
	const [showScForm, setShowScForm] = useState(false);
	const [scForm, setScForm] = useState(blankCurriculumForm);
	const [editingScId, setEditingScId] = useState<string | null>(null);
	const [editingScForm, setEditingScForm] = useState(blankCurriculumForm);
	const [scUpdating, setScUpdating] = useState(false);
	const [quickLectureForms, setQuickLectureForms] = useState<
		Record<string, IStudyCurriculumLecture>
	>({});
	const [quickAddingScId, setQuickAddingScId] = useState<string | null>(null);

	const [studyMaterials, setStudyMaterials] = useState<IStudyMaterial[]>([]);
	const [smPosting, setSmPosting] = useState(false);
	const [showSmForm, setShowSmForm] = useState(false);
	const [smForm, setSmForm] = useState({ title: '', description: '', fileUrl: '' });
	const [editingSmId, setEditingSmId] = useState<string | null>(null);
	const [editingSmForm, setEditingSmForm] = useState({ title: '', description: '', fileUrl: '' });
	const [smUpdating, setSmUpdating] = useState(false);

	useEffect(() => {
		if (!courseId) return;
		courseService
			.getById(courseId)
			.then((r) => {
				setCourse(r.data ?? null);
				const first = r.data?.sections
					?.flatMap((s) => s.lectures)
					.find((l) => l.videoUrl);
				if (first) setActiveLecture(first);
			})
			.finally(() => setLoading(false));

		enrollmentService
			.getCourseCount(courseId)
			.then((r) => setEnrolledCount(r.data?.count ?? null))
			.catch(() => {});

		qaService
			.getCourseQuestions(courseId)
			.then((r) => setQaCount(r.data?.length ?? 0))
			.catch(() => {});
	}, [courseId]);

	useEffect(() => {
		if (initialQuestionId) setActiveNav('qa');
	}, [initialQuestionId]);

	useEffect(() => {
		if (courseId) {
			announcementService
				.getByCourse(courseId)
				.then((r) => setAnnouncements(r.data ?? []))
				.catch(() => {});
		}
	}, [courseId]);

	useEffect(() => {
		if (courseId) {
			studyCurriculumService
				.getByCourse(courseId)
				.then((r) => setStudyCurricula(r.data ?? []))
				.catch(() => {});
		}
	}, [courseId]);

	useEffect(() => {
		if (courseId) {
			studyMaterialService
				.getByCourse(courseId)
				.then((r) => setStudyMaterials(r.data ?? []))
				.catch(() => {});
		}
	}, [courseId]);

	useEffect(() => {
		if (!courseId || !user || user.role === 'Student') return;
		setStudentsLoading(true);
		enrollmentService
			.getCourseStudents(courseId)
			.then((r) => setCourseStudents(r.data ?? []))
			.catch(() => {})
			.finally(() => setStudentsLoading(false));
	}, [courseId, user?._id, user?.role]);

	const isTeacherAssigned =
		user?.role === 'Teacher' &&
		(course?.teachers ?? []).some((t) => t.userId === user?._id);
	const canPost =
		user?.role === 'Super Admin' || user?.role === 'Admin' || user?.role === 'Moderator' || isTeacherAssigned;
	const canPostLiveClass =
		user?.role === 'Super Admin' || user?.role === 'Admin' || isTeacherAssigned;

	const canPostQA =
		user?.role === 'Super Admin' ||
		user?.role === 'Admin' ||
		user?.role === 'Moderator' ||
		isTeacherAssigned ||
		user?.role === 'Student';

	const handlePostAnnouncement = async () => {
		if (!annForm.title.trim() || !annForm.description.trim()) {
			toast.error('Title and description are required');
			return;
		}
		setAnnPosting(true);
		try {
			const res = await announcementService.create(courseId!, annForm);
			if (res.data) setAnnouncements((p) => [res.data!, ...p]);
			setAnnForm({ title: '', description: '' });
			setShowAnnForm(false);
			toast.success('Announcement posted');
		} catch {
			// error toast handled by interceptor
		} finally {
			setAnnPosting(false);
		}
	};

	const handleDeleteAnnouncement = async (id: string) => {
		const confirmed = await confirm({
			title: 'Delete Announcement',
			message: 'Delete this announcement?',
			confirmText: 'Delete',
			cancelText: 'Keep',
		});
		if (!confirmed) return;
		try {
			await announcementService.delete(id);
			setAnnouncements((p) => p.filter((a) => a._id !== id));
			toast.success('Announcement deleted');
		} catch {
			// error toast handled by interceptor
		}
	};

	const startEditAnnouncement = (ann: IAnnouncement) => {
		setEditingAnnId(ann._id);
		setEditingAnnForm({ title: ann.title, description: ann.description });
	};

	const handleUpdateAnnouncement = async () => {
		if (!editingAnnId) return;
		if (!editingAnnForm.title.trim() || !editingAnnForm.description.trim()) {
			toast.error('Title and description are required');
			return;
		}
		setAnnUpdating(true);
		try {
			const res = await announcementService.update(editingAnnId, editingAnnForm);
			if (res.data) {
				setAnnouncements((p) =>
					p.map((a) => (a._id === editingAnnId ? res.data! : a)),
				);
			}
			setEditingAnnId(null);
			toast.success('Announcement updated');
		} finally {
			setAnnUpdating(false);
		}
	};

	const setCurriculumLecture = (
		setter: React.Dispatch<React.SetStateAction<ReturnType<typeof blankCurriculumForm>>>,
		index: number,
		field: keyof IStudyCurriculumLecture,
		value: string,
	) => {
		setter((prev) => ({
			...prev,
			lectures: prev.lectures.map((lecture, i) =>
				i === index ? { ...lecture, [field]: value } : lecture,
			),
		}));
	};

	const addCurriculumLecture = (
		setter: React.Dispatch<React.SetStateAction<ReturnType<typeof blankCurriculumForm>>>,
	) => {
		setter((prev) => ({
			...prev,
			lectures: [...prev.lectures, blankCurriculumLecture()],
		}));
	};

	const removeCurriculumLecture = (
		setter: React.Dispatch<React.SetStateAction<ReturnType<typeof blankCurriculumForm>>>,
		index: number,
	) => {
		setter((prev) => ({
			...prev,
			lectures:
				prev.lectures.length > 1
					? prev.lectures.filter((_lecture, i) => i !== index)
					: [blankCurriculumLecture()],
		}));
	};

	const validateCurriculumForm = (form: ReturnType<typeof blankCurriculumForm>) => {
		if (!form.title.trim() || !form.description.trim() || !form.weekName.trim()) {
			toast.error('Title, description, and week name are required');
			return false;
		}
		const invalidLecture = form.lectures.some(
			(lecture) => !lecture.title.trim() || !lecture.day.trim() || !lecture.time.trim(),
		);
		if (invalidLecture) {
			toast.error('Each class needs a title, day, and time');
			return false;
		}
		return true;
	};

	const handlePostStudyCurriculum = async () => {
		if (!validateCurriculumForm(scForm)) return;
		setScPosting(true);
		try {
			const res = await studyCurriculumService.create(courseId!, scForm);
			if (res.data) setStudyCurricula((p) => [...p, res.data!]);
			setScForm(blankCurriculumForm());
			setShowScForm(false);
			toast.success('Live class added');
		} catch {
			// error toast handled by interceptor
		} finally {
			setScPosting(false);
		}
	};

	const startEditStudyCurriculum = (curriculum: IStudyCurriculum) => {
		setEditingScId(curriculum._id);
		setEditingScForm({
			title: curriculum.title,
			description: curriculum.description,
			weekName: curriculum.weekName,
			lectures:
				curriculum.lectures.length > 0
					? curriculum.lectures.map((lecture) => ({
							_id: lecture._id,
							title: lecture.title,
							description: lecture.description ?? '',
							day: lecture.day,
							time: lecture.time,
						}))
					: [blankCurriculumLecture()],
		});
	};

	const handleUpdateStudyCurriculum = async () => {
		if (!editingScId || !validateCurriculumForm(editingScForm)) return;
		setScUpdating(true);
		try {
			const res = await studyCurriculumService.update(editingScId, editingScForm);
			if (res.data) {
				setStudyCurricula((p) =>
					p.map((curriculum) =>
						curriculum._id === editingScId ? res.data! : curriculum,
					),
				);
			}
			setEditingScId(null);
			toast.success('Live class updated');
		} finally {
			setScUpdating(false);
		}
	};

	const handleDeleteStudyCurriculum = async (id: string) => {
		const confirmed = await confirm({
			title: 'Delete Live Class',
			message: 'Delete this live class plan?',
			confirmText: 'Delete',
			cancelText: 'Keep',
		});
		if (!confirmed) return;
		try {
			await studyCurriculumService.delete(id);
			setStudyCurricula((p) => p.filter((curriculum) => curriculum._id !== id));
			toast.success('Live class plan deleted');
		} catch {
			// error toast handled by interceptor
		}
	};

	const setQuickLectureField = (
		curriculumId: string,
		field: keyof IStudyCurriculumLecture,
		value: string,
	) => {
		setQuickLectureForms((prev) => ({
			...prev,
			[curriculumId]: {
				...(prev[curriculumId] ?? blankCurriculumLecture()),
				[field]: value,
			},
		}));
	};

	const startQuickAddLecture = (curriculumId: string) => {
		setQuickAddingScId(curriculumId);
		setQuickLectureForms((prev) => ({
			...prev,
			[curriculumId]: prev[curriculumId] ?? blankCurriculumLecture(),
		}));
	};

	const handleQuickAddLecture = async (curriculum: IStudyCurriculum) => {
		const lecture = quickLectureForms[curriculum._id] ?? blankCurriculumLecture();
		if (!lecture.title.trim() || !lecture.day.trim() || !lecture.time.trim()) {
			toast.error('Class title, day, and time are required');
			return;
		}
		setQuickAddingScId(curriculum._id);
		try {
			const res = await studyCurriculumService.update(curriculum._id, {
				title: curriculum.title,
				description: curriculum.description,
				weekName: curriculum.weekName,
				lectures: [
					...curriculum.lectures,
					{
						title: lecture.title.trim(),
						description: lecture.description?.trim() ?? '',
						day: lecture.day.trim(),
						time: lecture.time.trim(),
					},
				],
			});
			if (res.data) {
				setStudyCurricula((p) =>
					p.map((item) => (item._id === curriculum._id ? res.data! : item)),
				);
			}
			setQuickLectureForms((prev) => ({
				...prev,
				[curriculum._id]: blankCurriculumLecture(),
			}));
			setQuickAddingScId(null);
			toast.success('Class added');
		} finally {
			setQuickAddingScId(null);
		}
	};

	const handlePostStudyMaterial = async () => {
		if (!smForm.title.trim() || !smForm.description.trim()) {
			toast.error('Title and description are required');
			return;
		}
		setSmPosting(true);
		try {
			const res = await studyMaterialService.create(courseId!, {
				title: smForm.title,
				description: smForm.description,
				fileUrl: smForm.fileUrl.trim() || undefined,
			});
			if (res.data) setStudyMaterials((p) => [res.data!, ...p]);
			setSmForm({ title: '', description: '', fileUrl: '' });
			setShowSmForm(false);
			toast.success('Study material added');
		} catch {
			// error toast handled by interceptor
		} finally {
			setSmPosting(false);
		}
	};

	const handleDeleteStudyMaterial = async (id: string) => {
		const confirmed = await confirm({
			title: 'Delete Study Material',
			message: 'Delete this study material?',
			confirmText: 'Delete',
			cancelText: 'Keep',
		});
		if (!confirmed) return;
		try {
			await studyMaterialService.delete(id);
			setStudyMaterials((p) => p.filter((m) => m._id !== id));
			toast.success('Study material deleted');
		} catch {
			// error toast handled by interceptor
		}
	};

	const startEditStudyMaterial = (mat: IStudyMaterial) => {
		setEditingSmId(mat._id);
		setEditingSmForm({
			title: mat.title,
			description: mat.description,
			fileUrl: mat.fileUrl ?? '',
		});
	};

	const handleUpdateStudyMaterial = async () => {
		if (!editingSmId) return;
		if (!editingSmForm.title.trim() || !editingSmForm.description.trim()) {
			toast.error('Title and description are required');
			return;
		}
		setSmUpdating(true);
		try {
			const res = await studyMaterialService.update(editingSmId, {
				title: editingSmForm.title,
				description: editingSmForm.description,
				fileUrl: editingSmForm.fileUrl.trim() || undefined,
			});
			if (res.data) {
				setStudyMaterials((p) =>
					p.map((m) => (m._id === editingSmId ? res.data! : m)),
				);
			}
			setEditingSmId(null);
			toast.success('Study material updated');
		} finally {
			setSmUpdating(false);
		}
	};

	const handleExportStudents = async () => {
		if (!courseId) return;
		setStudentsExporting(true);
		try {
			const blob = await enrollmentService.exportCourseStudents(courseId);
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			const baseName = `${course?.title ?? 'course'}-students`
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '');
			link.download = `${baseName}.csv`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);
		} finally {
			setStudentsExporting(false);
		}
	};

	const totalLectures =
		course?.sections?.reduce((a, s) => a + s.lectures.length, 0) ?? 0;
	const totalDurationSec =
		course?.sections?.reduce(
			(a, s) => a + s.lectures.reduce((b, l) => b + (l.duration ?? 0), 0),
			0,
		) ?? 0;

	if (loading) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	if (!course) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
				}}
			>
				<Typography color='text.secondary'>Course not found.</Typography>
			</Box>
		);
	}

	const isAdminRole = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Moderator';
	const isTeacherOrAdmin = user?.role === 'Teacher' || isAdminRole;
	const canSeeStudentList = Boolean(user && user.role !== 'Student');
	const canExportStudentList = isAdminRole;
	const visibleNavItems = NAV_ITEMS.filter(
		(item) =>
			(item.key !== 'students' || canSeeStudentList) &&
			(item.key !== 'support_chat' || user?.role === 'Student'),
	);

	return (
		<Box
			sx={{
				display: 'flex',
				height: isTeacherOrAdmin ? '100%' : '100vh',
				overflow: 'hidden',
				bgcolor: 'background.default',
			}}
		>
			{!isTeacherOrAdmin && <StudentSidebar />}

			<Box
				sx={{
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					overflow: 'hidden',
					minWidth: 0,
				}}
			>
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
						<IconButton size='small' onClick={() => navigate(-1)}>
							<ArrowBackIcon fontSize='small' />
						</IconButton>
					</Tooltip>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Typography
							variant='subtitle1'
							sx={{
								fontWeight: 700,
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
								lineHeight: 1.3,
							}}
						>
							{course.title}
						</Typography>
						{activeNav === 'video_lectures' && activeLecture && (
							<Typography
								variant='caption'
								color='text.secondary'
								noWrap
								sx={{ display: 'block' }}
							>
								{activeLecture.title}
							</Typography>
						)}
					</Box>
				</Box>

				{/* Body: left nav + center + right */}
				<Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
					{/* Left nav */}
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
							{visibleNavItems.map((item) => {
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
											'&.Mui-selected': {
												bgcolor: 'primary.50',
												color: 'primary.main',
											},
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

					{/* Center content */}
					<Box
						sx={{
							flex: 1,
							display: 'flex',
							flexDirection: 'column',
							overflow: (activeNav === 'support_chat' || activeNav === 'quiz_bank') ? 'hidden' : 'auto',
							minWidth: 0,
						}}
					>
						{/* Video Lectures */}
						{activeNav === 'video_lectures' && (
							<LearningVideoPlayer
								activeLecture={activeLecture}
								courseId={courseId ?? ''}
								canPostQA={canPostQA}
								userId={user?._id ?? ''}
								userRole={user?.role ?? ''}
								initialQuestionId={initialQuestionId}
							/>
						)}

						{activeNav === 'course_overview' && (
							<CourseLearningCourseOverview
								course={course}
								enrolledCount={enrolledCount}
								totalLectures={totalLectures}
								totalDurationSec={totalDurationSec}
								announcementsCount={announcements.length}
								studyMaterialsCount={studyMaterials.length}
								studyCurriculaCount={studyCurricula.length}
								qaCount={qaCount}
							/>
						)}

						{activeNav === 'teacher' && (
							<CourseLearningTeacherTab course={course} />
						)}

						{activeNav === 'announcements' && (
							<CourseLearningAnnouncementsTab
								announcements={announcements}
								canPost={canPost}
								userId={user?._id}
								userRole={user?.role}
								showAnnForm={showAnnForm}
								annForm={annForm}
								annPosting={annPosting}
								editingAnnId={editingAnnId}
								editingAnnForm={editingAnnForm}
								annUpdating={annUpdating}
								onToggleForm={() => setShowAnnForm((p) => !p)}
								onAnnFormChange={(field, value) =>
									setAnnForm((p) => ({ ...p, [field]: value }))
								}
								onPost={() => void handlePostAnnouncement()}
								onCancelPost={() => {
									setShowAnnForm(false);
									setAnnForm({ title: '', description: '' });
								}}
								onStartEdit={startEditAnnouncement}
								onEditFormChange={(field, value) =>
									setEditingAnnForm((p) => ({ ...p, [field]: value }))
								}
								onUpdate={() => void handleUpdateAnnouncement()}
								onCancelEdit={() => setEditingAnnId(null)}
								onDelete={(id) => void handleDeleteAnnouncement(id)}
							/>
						)}

						{activeNav === 'live_class' && (
							<CourseLearningLiveClassTab
								studyCurricula={studyCurricula}
								canPostLiveClass={canPostLiveClass}
								isTeacherOrAdmin={isTeacherOrAdmin}
								userId={user?._id}
								userRole={user?.role}
								showScForm={showScForm}
								scForm={scForm}
								scPosting={scPosting}
								editingScId={editingScId}
								editingScForm={editingScForm}
								scUpdating={scUpdating}
								quickLectureForms={quickLectureForms}
								quickAddingScId={quickAddingScId}
								onToggleForm={() => setShowScForm((p) => !p)}
								onScFormChange={(field, value) =>
									setScForm((p) => ({ ...p, [field]: value }))
								}
								onPost={() => void handlePostStudyCurriculum()}
								onCancelAdd={() => {
									setShowScForm(false);
									setScForm(blankCurriculumForm());
								}}
								onAddScLecture={() => addCurriculumLecture(setScForm)}
								onRemoveScLecture={(i) => removeCurriculumLecture(setScForm, i)}
								onChangeScLecture={(i, f, v) => setCurriculumLecture(setScForm, i, f, v)}
								onStartEdit={startEditStudyCurriculum}
								onEditFormChange={(field, value) =>
									setEditingScForm((p) => ({ ...p, [field]: value }))
								}
								onUpdate={() => void handleUpdateStudyCurriculum()}
								onCancelEdit={() => setEditingScId(null)}
								onAddEditScLecture={() => addCurriculumLecture(setEditingScForm)}
								onRemoveEditScLecture={(i) => removeCurriculumLecture(setEditingScForm, i)}
								onChangeEditScLecture={(i, f, v) => setCurriculumLecture(setEditingScForm, i, f, v)}
								onDelete={(id) => void handleDeleteStudyCurriculum(id)}
								onStartQuickAdd={startQuickAddLecture}
								onQuickAdd={(curriculum) => void handleQuickAddLecture(curriculum)}
								onCancelQuickAdd={() => setQuickAddingScId(null)}
								onQuickLectureFieldChange={setQuickLectureField}
							/>
						)}

						{activeNav === 'study_materials' && (
							<CourseLearningStudyMaterialsTab
								studyMaterials={studyMaterials}
								canPost={canPost}
								userId={user?._id}
								userRole={user?.role}
								showSmForm={showSmForm}
								smForm={smForm}
								smPosting={smPosting}
								editingSmId={editingSmId}
								editingSmForm={editingSmForm}
								smUpdating={smUpdating}
								onToggleForm={() => setShowSmForm((p) => !p)}
								onSmFormChange={(field, value) =>
									setSmForm((p) => ({ ...p, [field]: value }))
								}
								onPost={() => void handlePostStudyMaterial()}
								onCancelPost={() => {
									setShowSmForm(false);
									setSmForm({ title: '', description: '', fileUrl: '' });
								}}
								onStartEdit={startEditStudyMaterial}
								onEditFormChange={(field, value) =>
									setEditingSmForm((p) => ({ ...p, [field]: value }))
								}
								onUpdate={() => void handleUpdateStudyMaterial()}
								onCancelEdit={() => setEditingSmId(null)}
								onDelete={(id) => void handleDeleteStudyMaterial(id)}
							/>
						)}

						{activeNav === 'students' && canSeeStudentList && (
							<CourseLearningStudentsTab
								courseStudents={courseStudents}
								studentsLoading={studentsLoading}
								studentsExporting={studentsExporting}
								canExportStudentList={canExportStudentList}
								userRole={user?.role}
								studentsPage={studentsPage}
								pageSize={STUDENTS_PAGE_SIZE}
								onExport={() => void handleExportStudents()}
								onPageChange={setStudentsPage}
							/>
						)}

						{activeNav === 'qa' && (
							<Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 860 }}>
								<CourseQASection
									courseId={courseId ?? ''}
									canPost={canPostQA}
									userId={user?._id ?? ''}
									userRole={user?.role ?? ''}
									initialQuestionId={initialQuestionId}
								/>
							</Box>
						)}

						{activeNav === 'quiz_bank' && (
							<QuizBankTab
								courseId={courseId ?? ''}
								canPost={canPost}
								userId={user?._id ?? ''}
							/>
						)}

						{activeNav === 'support_chat' && (
							<StudentChatPage embedded />
						)}
					</Box>

					{/* Right lecture sidebar (Video Lectures only) */}
					{activeNav === 'video_lectures' && (
						<CourseLearningLectureSidebar
							course={course}
							activeLecture={activeLecture}
							totalLectures={totalLectures}
							onSelectLecture={setActiveLecture}
						/>
					)}
				</Box>
			</Box>
			{!isTeacherOrAdmin && activeNav !== 'support_chat' && <ChatWidget />}
		</Box>
	);
};

export default StudentCourseLearningPage;
