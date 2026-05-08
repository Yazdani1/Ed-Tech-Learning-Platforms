import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	Grid,
	IconButton,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
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
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import LanguageIcon from '@mui/icons-material/Language';
import toast from 'react-hot-toast';
import { courseService } from '../../services/course.service';
import { enrollmentService } from '../../services/enrollment.service';
import { announcementService } from '../../services/announcement.service';
import { studyCurriculumService } from '../../services/studyCurriculum.service';
import { studyMaterialService } from '../../services/studyMaterial.service';
import { qaService } from '../../services/qa.service';
import {
	formatLectureDuration,
	formatSectionDuration,
} from '../../utils/duration';
import {
	formatDateTime,
	formatLiveClassDate,
	formatLiveClassTime,
} from '../../utils/dateTime';
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
import { useAuth } from '../../context/useAuth';
import RichTextEditor from '../../components/course/RichTextEditor';
import ItemActionMenu from '../../components/common/ItemActionMenu';
import YouBadge from '../../components/common/YouBadge';
import { useConfirmModal } from '../../context/ConfirmModalContext';

type NavSection =
	| 'course_overview'
	| 'video_lectures'
	| 'live_class'
	| 'teacher'
	| 'announcements'
	| 'study_materials'
	| 'students'
	| 'qa';

const getYouTubeId = (url: string) => {
	const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
	return m ? m[1] : null;
};

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
];

export default function StudentCourseLearningPage() {
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
	const [smForm, setSmForm] = useState({
		title: '',
		description: '',
		fileUrl: '',
	});
	const [editingSmId, setEditingSmId] = useState<string | null>(null);
	const [editingSmForm, setEditingSmForm] = useState({
		title: '',
		description: '',
		fileUrl: '',
	});
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

	// Students accessing the learning page are enrolled; teachers are assigned; admins can always post
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

	const videoId = activeLecture?.videoUrl
		? getYouTubeId(activeLecture.videoUrl)
		: null;
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
	const visibleNavItems = NAV_ITEMS.filter((item) => item.key !== 'students' || canSeeStudentList);

	return (
		<Box
			sx={{
				display: 'flex',
				height: isTeacherOrAdmin ? '100%' : '100vh',
				overflow: 'hidden',
				bgcolor: 'background.default',
			}}
		>
			{/* ── Main student sidebar (hidden for teachers and admins who have their own layout) ─── */}
			{!isTeacherOrAdmin && <StudentSidebar />}

			{/* ── Learning area ───────────────────────────────────────── */}
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

					{/* ── Center content ────────────────────────────────── */}
					<Box
						sx={{
							flex: 1,
							display: 'flex',
							flexDirection: 'column',
							overflow: 'auto',
							minWidth: 0,
						}}
					>
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
											<Typography color='grey.500'>
												{activeLecture
													? 'No video available for this lecture'
													: 'Select a lecture to start watching'}
											</Typography>
										</Box>
									)}
								</Box>

								{activeLecture && (
									<Box
										sx={{
											p: 3,
											borderBottom: '1px solid',
											borderColor: 'divider',
										}}
									>
										<Typography variant='h6' sx={{ fontWeight: 700, mb: 0.5 }}>
											{activeLecture.title}
										</Typography>
										{activeLecture.description && (
											<Typography variant='body2' color='text.secondary'>
												{activeLecture.description}
											</Typography>
										)}
										{activeLecture.duration !== null &&
											activeLecture.duration !== undefined && (
											<Typography
												variant='caption'
												color='text.secondary'
												sx={{ mt: 0.5, display: 'block' }}
											>
												Duration:{' '}
												{formatLectureDuration(activeLecture.duration)}
											</Typography>
										)}
									</Box>
								)}

								{/* ── Q&A below video ───────────────────────────── */}
								<Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 860 }}>
									<CourseQASection
										courseId={courseId!}
										canPost={canPostQA}
										userId={user?._id ?? ''}
										userRole={user?.role ?? ''}
										initialQuestionId={initialQuestionId}
									/>
								</Box>
							</>
						)}

						{/* ── Course Overview ────────────────────────────── */}
						{activeNav === 'course_overview' && (
							<Box sx={{ p: { xs: 3, md: 4 }, width: '100%' }}>
								<Typography
									variant='h4'
									sx={{ fontWeight: 800, mb: 0.75, lineHeight: 1.25 }}
								>
									{course.title}
								</Typography>
								{course.subtitle && (
									<Typography
										variant='h6'
										sx={{ fontWeight: 400, color: 'text.secondary', mb: 2 }}
									>
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

								{/* Stats Grid */}
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: {
											xs: '1fr 1fr',
											sm: 'repeat(3, 1fr)',
											md: 'repeat(4, 1fr)',
										},
										gap: { xs: 2.5, sm: 3 },
										mb: 4,
										p: 3,
										bgcolor: 'background.paper',
										border: '1px solid',
										borderColor: 'divider',
										borderRadius: 2,
										boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
									}}
								>
									<StatItem
										icon={<PeopleOutlinedIcon />}
										label='Enrolled Students'
										value={
											enrolledCount !== null
												? enrolledCount.toLocaleString()
												: '—'
										}
									/>
									<StatItem
										icon={<OndemandVideoIcon />}
										label='Video Lectures'
										value={String(totalLectures)}
									/>
									<StatItem
										icon={<AccessTimeIcon />}
										label='Total Duration'
										value={
											totalDurationSec > 0
												? formatSectionDuration(totalDurationSec)
												: '—'
										}
									/>
									<StatItem
										icon={<MenuBookOutlinedIcon />}
										label='Sections'
										value={String(course.sections?.length ?? 0)}
									/>
									<StatItem
										icon={<CampaignOutlinedIcon />}
										label='Announcements'
										value={String(announcements.length)}
									/>
									<StatItem
										icon={<MenuBookOutlinedIcon />}
										label='Study Materials'
										value={String(studyMaterials.length)}
									/>
									<StatItem
										icon={<EventNoteOutlinedIcon />}
										label='Live Class'
										value={String(studyCurricula.length)}
									/>
									<StatItem
										icon={<QuestionAnswerOutlinedIcon />}
										label='Q & A Questions'
										value={String(qaCount)}
									/>
									<StatItem
										icon={<PersonOutlinedIcon />}
										label='Total Teachers'
										value={String(course.teachers?.length ?? 0)}
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
													<Box
														sx={{
															display: 'flex',
															gap: 1.25,
															alignItems: 'flex-start',
														}}
													>
														<CheckCircleOutlinedIcon
															sx={{
																color: 'success.main',
																fontSize: 18,
																flexShrink: 0,
																mt: 0.2,
															}}
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
											sx={{
												'& p': { mt: 0, mb: 1.5 },
												'& ul': { pl: 3 },
												lineHeight: 1.8,
												color: 'text.secondary',
											}}
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
								<Typography
									variant='body2'
									color='text.secondary'
									sx={{ mb: 4 }}
								>
									{course.teachers?.length ?? 0} instructor
									{(course.teachers?.length ?? 0) !== 1 ? 's' : ''} teaching
									this course
								</Typography>

								{(course.teachers?.length ?? 0) === 0 ? (
									<Typography color='text.secondary'>
										No instructors listed for this course.
									</Typography>
								) : (
									<Box
										sx={{
											display: 'grid',
											gridTemplateColumns: {
												xs: '1fr',
												sm: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
												xl: 'repeat(auto-fill, minmax(340px, 1fr))',
											},
											gap: 3,
											width: '100%',
										}}
									>
										{course.teachers.map((teacher) => {
											const hasSocials =
												teacher.socialLinks &&
												Object.values(teacher.socialLinks).some(Boolean);

											return (
												<Box key={teacher._id} sx={{ minWidth: 0 }}>
													<Paper
														variant='outlined'
														sx={{
															height: '100%',
															borderRadius: 1,
															overflow: 'hidden',
															display: 'flex',
															flexDirection: 'column',
															bgcolor: 'background.paper',
															transition: 'transform 0.25s ease, box-shadow 0.25s ease',
															'&:hover': {
																transform: 'translateY(-4px)',
																boxShadow: '0 18px 42px rgba(15,23,42,0.12)',
															},
														}}
													>
														<Box
															sx={{
																height: 108,
																background:
																	'linear-gradient(135deg, #0f766e 0%, #2563eb 55%, #7c3aed 100%)',
																position: 'relative',
															}}
														>
															<Avatar
																src={teacher.profileImage}
																alt={teacher.name}
																sx={{
																	width: 96,
																	height: 96,
																	position: 'absolute',
																	left: '50%',
																	bottom: -48,
																	transform: 'translateX(-50%)',
																	border: '4px solid white',
																	bgcolor: 'primary.main',
																	fontSize: 34,
																	fontWeight: 800,
																	boxShadow: '0 10px 28px rgba(15,23,42,0.2)',
																}}
															>
																{teacher.name.charAt(0).toUpperCase()}
															</Avatar>
														</Box>

														<Box
															sx={{
																pt: 7,
																px: 3,
																pb: 3,
																flex: 1,
																display: 'flex',
																flexDirection: 'column',
																alignItems: 'center',
																textAlign: 'center',
															}}
														>
															<Typography variant='h6' sx={{ fontWeight: 800, lineHeight: 1.2 }}>
																{teacher.name}
															</Typography>

															{teacher.expertise?.length > 0 && (
																<Box
																	sx={{
																		display: 'flex',
																		gap: 0.75,
																		flexWrap: 'wrap',
																		justifyContent: 'center',
																		mt: 1.5,
																	}}
																>
																	{teacher.expertise.slice(0, 4).map((exp) => (
																		<Chip
																			key={exp}
																			label={exp}
																			size='small'
																			sx={{
																				fontWeight: 700,
																				bgcolor: 'rgba(37,99,235,0.08)',
																				color: 'primary.main',
																			}}
																		/>
																	))}
																	{teacher.expertise.length > 4 && (
																		<Chip label={`+${teacher.expertise.length - 4}`} size='small' />
																	)}
																</Box>
															)}

															{teacher.bio && (
																<Typography
																	variant='body2'
																	color='text.secondary'
																	sx={{
																		mt: 2,
																		lineHeight: 1.7,
																		display: '-webkit-box',
																		WebkitLineClamp: 4,
																		WebkitBoxOrient: 'vertical',
																		overflow: 'hidden',
																	}}
																>
																	{teacher.bio}
																</Typography>
															)}

															<Box sx={{ flexGrow: 1 }} />

															{hasSocials && (
																<Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2.5 }}>
																	{teacher.socialLinks?.website && (
																		<Tooltip title='Website'>
																			<IconButton component='a' href={teacher.socialLinks.website} target='_blank' size='small' sx={{ color: '#10b981', bgcolor: 'rgba(16,185,129,0.1)' }}>
																				<LanguageIcon fontSize='small' />
																			</IconButton>
																		</Tooltip>
																	)}
																	{teacher.socialLinks?.linkedin && (
																		<Tooltip title='LinkedIn'>
																			<IconButton component='a' href={teacher.socialLinks.linkedin} target='_blank' size='small' sx={{ color: '#0A66C2', bgcolor: 'rgba(10,102,194,0.1)' }}>
																				<LinkedInIcon fontSize='small' />
																			</IconButton>
																		</Tooltip>
																	)}
																	{teacher.socialLinks?.twitter && (
																		<Tooltip title='Twitter'>
																			<IconButton component='a' href={teacher.socialLinks.twitter} target='_blank' size='small' sx={{ color: '#1DA1F2', bgcolor: 'rgba(29,161,242,0.1)' }}>
																				<TwitterIcon fontSize='small' />
																			</IconButton>
																		</Tooltip>
																	)}
																</Box>
															)}
														</Box>
													</Paper>
												</Box>
											);
										})}
									</Box>
								)}
							</Box>
						)}

						{/* ── Announcements ──────────────────────────────── */}
						{activeNav === 'announcements' && (
							<Box sx={{ p: 4, maxWidth: 800 }}>
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										mb: 3,
									}}
								>
									<Typography variant='h5' sx={{ fontWeight: 700 }}>
										Announcements ({announcements.length})
									</Typography>
									{canPost && (
										<Button
											variant='contained'
											startIcon={<AddIcon />}
											onClick={() => setShowAnnForm((p) => !p)}
										>
											Post Announcement
										</Button>
									)}
								</Box>

								{/* Post form */}
								{canPost && showAnnForm && (
									<Paper
										variant='outlined'
										sx={{ p: 2.5, mb: 3, borderRadius: 0.5 }}
									>
										<Typography
											variant='subtitle2'
											sx={{ fontWeight: 600, mb: 1.5 }}
										>
											New Announcement
										</Typography>
										<TextField
											label='Title'
											value={annForm.title}
											onChange={(e) =>
												setAnnForm((p) => ({ ...p, title: e.target.value }))
											}
											fullWidth
											size='small'
											sx={{ mb: 1.5 }}
										/>
										<RichTextEditor
											value={annForm.description}
											onChange={(html) =>
												setAnnForm((p) => ({ ...p, description: html }))
											}
											placeholder='Enter announcement description...'
											minHeight={100}
										/>
										<Box
											sx={{
												display: 'flex',
												gap: 1,
												justifyContent: 'flex-end',
											}}
										>
											<Button
												size='small'
												onClick={() => {
													setShowAnnForm(false);
													setAnnForm({ title: '', description: '' });
												}}
											>
												Cancel
											</Button>
											<Button
												size='small'
												variant='contained'
												onClick={() => void handlePostAnnouncement()}
												disabled={annPosting}
											>
												{annPosting ? <CircularProgress size={16} /> : 'Post'}
											</Button>
										</Box>
									</Paper>
								)}

								{/* Announcements list */}
								{announcements.length === 0 ? (
									<Typography color='text.secondary'>
										No announcements yet.
									</Typography>
								) : (
									<Box
										sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
									>
										{announcements.map((ann) => {
											const canDelete =
												user?._id === ann.postedBy._id ||
												user?.role === 'Admin' ||
												user?.role === 'Super Admin' ||
												user?.role === 'Moderator';
											return (
												<Paper
													key={ann._id}
													variant='outlined'
													sx={{ p: 2.5, borderRadius: 0.5 }}
												>
													<Box
														sx={{
															display: 'flex',
															justifyContent: 'space-between',
															alignItems: 'flex-start',
														}}
													>
												<Box sx={{ flex: 1 }}>
															<Box
																sx={{
																	display: 'flex',
																	alignItems: 'center',
																	gap: 1,
																	mb: 1,
																}}
															>
																<Avatar
																	src={ann.postedBy.avatar}
																	sx={{
																		width: 22,
																		height: 22,
																		fontSize: 12,
																		bgcolor: 'primary.main',
																	}}
																>
																	{ann.postedBy.name[0]}
																</Avatar>
																<Typography
																	variant='caption'
																	color='text.secondary'
																>
																	{ann.postedBy.name}{' '}
																	{user?._id === ann.postedBy._id && <YouBadge />}{' '}
																	&bull; {ann.postedBy.role}{' '}
																	&bull; {formatDateTime(ann.createdAt)}
																</Typography>
															</Box>
															{editingAnnId === ann._id ? (
																<Box sx={{ mb: 2 }}>
																	<TextField
																		label='Title'
																		value={editingAnnForm.title}
																		onChange={(e) =>
																			setEditingAnnForm((p) => ({
																				...p,
																				title: e.target.value,
																			}))
																		}
																		fullWidth
																		size='small'
																		sx={{ mb: 1.5 }}
																	/>
																	<RichTextEditor
																		value={editingAnnForm.description}
																		onChange={(html) =>
																			setEditingAnnForm((p) => ({
																				...p,
																				description: html,
																			}))
																		}
																		placeholder='Update announcement description...'
																		minHeight={100}
																	/>
																	<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1.5 }}>
																		<Button
																			size='small'
																			onClick={() => setEditingAnnId(null)}
																		>
																			Cancel
																		</Button>
																		<Button
																			size='small'
																			variant='contained'
																			onClick={() => void handleUpdateAnnouncement()}
																			disabled={annUpdating}
																		>
																			{annUpdating ? <CircularProgress size={16} /> : 'Update'}
																		</Button>
																	</Box>
																</Box>
															) : (
																<>
																	<Typography
																		variant='subtitle1'
																		sx={{ fontWeight: 700, mb: 0.5 }}
																	>
																		{ann.title}
																	</Typography>
																	<Box
																		sx={{
																			fontSize: '0.875rem',
																			lineHeight: 1.6,
																			'& p': { m: 0, mb: 0.5 },
																			'& ul, & ol': { pl: 2.5, my: 0.5 },
																		}}
																		dangerouslySetInnerHTML={{ __html: ann.description }}
																	/>
																</>
															)}
														</Box>
														<Box sx={{ ml: 1, flexShrink: 0 }}>
															{canDelete && (
																<ItemActionMenu
																	actions={[
																		{
																			label: 'Edit',
																			icon: (
																				<EditOutlinedIcon
																					fontSize='small'
																					sx={{ mr: 1 }}
																				/>
																			),
																			onClick: () => startEditAnnouncement(ann),
																		},
																		{
																			label: 'Delete',
																			color: 'error',
																			icon: (
																				<DeleteOutlinedIcon
																					fontSize='small'
																					sx={{ mr: 1 }}
																				/>
																			),
																			onClick: () =>
																				void handleDeleteAnnouncement(ann._id),
																		},
																	]}
																/>
															)}
														</Box>
													</Box>
												</Paper>
											);
										})}
									</Box>
								)}
							</Box>
						)}

						{/* Live Class */}
						{activeNav === 'live_class' && (
							<Box sx={{ p: 4, maxWidth: 1120 }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
									<Typography variant='h5' sx={{ fontWeight: 700 }}>
										Live Class ({studyCurricula.length})
									</Typography>
									{canPostLiveClass && (
										<Button variant='contained' startIcon={<AddIcon />} onClick={() => setShowScForm((p) => !p)}>
											Add Week
										</Button>
									)}
								</Box>

								{canPostLiveClass && showScForm && (
									<Paper variant='outlined' sx={{ p: 2.5, mb: 3, borderRadius: 0.5 }}>
										<Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1.5 }}>
											New Live Class
										</Typography>
										<Grid container spacing={1.5}>
											<Grid size={{ xs: 12, sm: 5 }}>
												<TextField label='Title' value={scForm.title} onChange={(e) => setScForm((p) => ({ ...p, title: e.target.value }))} fullWidth size='small' />
											</Grid>
											<Grid size={{ xs: 12, sm: 7 }}>
												<TextField label='Week Name' value={scForm.weekName} onChange={(e) => setScForm((p) => ({ ...p, weekName: e.target.value }))} fullWidth size='small' placeholder='First week' />
											</Grid>
										</Grid>
										<Box sx={{ mt: 1.5 }}>
											<RichTextEditor value={scForm.description} onChange={(html) => setScForm((p) => ({ ...p, description: html }))} placeholder='Enter live class week description...' minHeight={100} />
										</Box>
										<CurriculumLectureFields
											lectures={scForm.lectures}
											onAdd={() => addCurriculumLecture(setScForm)}
											onRemove={(index) => removeCurriculumLecture(setScForm, index)}
											onChange={(index, field, value) => setCurriculumLecture(setScForm, index, field, value)}
										/>
										<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
											<Button
												size='small'
												onClick={() => {
													setShowScForm(false);
													setScForm(blankCurriculumForm());
												}}
											>
												Cancel
											</Button>
											<Button size='small' variant='contained' onClick={() => void handlePostStudyCurriculum()} disabled={scPosting}>
												{scPosting ? <CircularProgress size={16} /> : 'Add'}
											</Button>
										</Box>
									</Paper>
								)}

								{studyCurricula.length === 0 ? (
									<Typography color='text.secondary'>No live class available.</Typography>
								) : (
									<Box
										sx={{
											display: 'grid',
											gridTemplateColumns: isTeacherOrAdmin
												? '1fr'
												: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
											gap: 2.5,
											alignItems: 'start',
										}}
									>
										{studyCurricula.map((curriculum, ci) => {
											const canManage =
												user?._id === curriculum.postedBy._id ||
												user?.role === 'Admin' ||
												user?.role === 'Super Admin' ||
												user?.role === 'Moderator';
											const isEditing = editingScId === curriculum._id;
											return (
												<Paper
													key={curriculum._id}
													variant='outlined'
													sx={{
														p: 2.5,
														borderRadius: 1,
														boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
													}}
												>
													<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
														<Box sx={{ flex: 1, minWidth: 0 }}>
															<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
																<Avatar src={curriculum.postedBy.avatar} sx={{ width: 22, height: 22, fontSize: 12, bgcolor: 'primary.main' }}>
																	{curriculum.postedBy.name[0]}
																</Avatar>
																<Typography variant='caption' color='text.secondary'>
																	{curriculum.postedBy.name} {user?._id === curriculum.postedBy._id && <YouBadge />} &bull; {curriculum.postedBy.role} &bull; {formatDateTime(curriculum.createdAt)}
																</Typography>
															</Box>
															{isEditing ? (
																<Box>
																	<Grid container spacing={1.5}>
																		<Grid size={{ xs: 12, sm: 5 }}>
																			<TextField label='Title' value={editingScForm.title} onChange={(e) => setEditingScForm((p) => ({ ...p, title: e.target.value }))} fullWidth size='small' />
																		</Grid>
																		<Grid size={{ xs: 12, sm: 7 }}>
																			<TextField label='Week Name' value={editingScForm.weekName} onChange={(e) => setEditingScForm((p) => ({ ...p, weekName: e.target.value }))} fullWidth size='small' />
																		</Grid>
																	</Grid>
																	<Box sx={{ mt: 1.5 }}>
																		<RichTextEditor value={editingScForm.description} onChange={(html) => setEditingScForm((p) => ({ ...p, description: html }))} placeholder='Update live class week description...' minHeight={100} />
																	</Box>
																	<CurriculumLectureFields
																		lectures={editingScForm.lectures}
																		onAdd={() => addCurriculumLecture(setEditingScForm)}
																		onRemove={(index) => removeCurriculumLecture(setEditingScForm, index)}
																		onChange={(index, field, value) => setCurriculumLecture(setEditingScForm, index, field, value)}
																	/>
																	<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
																		<Button size='small' onClick={() => setEditingScId(null)}>
																			Cancel
																		</Button>
																		<Button size='small' variant='contained' onClick={() => void handleUpdateStudyCurriculum()} disabled={scUpdating}>
																			{scUpdating ? <CircularProgress size={16} /> : 'Update'}
																		</Button>
																	</Box>
																</Box>
															) : (
																<>
																	<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: 2 }}>
																		<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', minWidth: 0 }}>
																			<Box
																				sx={{
																					width: 64,
																					minHeight: 78,
																					borderRadius: 1,
																					bgcolor: ci % 3 === 0 ? '#f59e0b' : ci % 3 === 1 ? '#fb7c3c' : '#0ea5e9',
																					color: 'white',
																					display: 'flex',
																					flexDirection: 'column',
																					alignItems: 'center',
																					justifyContent: 'center',
																					textAlign: 'center',
																					fontWeight: 800,
																					lineHeight: 1.15,
																					flexShrink: 0,
																				}}
																			>
																				<Typography sx={{ fontSize: '0.78rem', fontWeight: 800, lineHeight: 1.1 }}>
																					Week
																				</Typography>
																				<Typography sx={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.1 }}>
																					{ci + 1}
																				</Typography>
																			</Box>
																			<Box sx={{ minWidth: 0 }}>
																				<Typography variant='h6' sx={{ fontWeight: 800, color: '#111827', lineHeight: 1.25 }}>
																					{curriculum.title || curriculum.weekName}
																				</Typography>
																				<Typography variant='caption' color='text.secondary'>
																					{curriculum.weekName}
																				</Typography>
																			</Box>
																		</Box>
																		<Box
																			sx={{
																				display: 'flex',
																				alignItems: 'center',
																				gap: 0.75,
																				px: 1.25,
																				py: 0.65,
																				borderRadius: 1,
																				bgcolor: 'grey.100',
																				color: '#111827',
																				flexShrink: 0,
																			}}
																		>
																			<EventNoteOutlinedIcon sx={{ fontSize: 17 }} />
																			<Typography variant='caption' sx={{ fontWeight: 800 }}>
																				{curriculum.lectures.length} Live Class
																			</Typography>
																		</Box>
																	</Box>
																	<Box sx={{ fontSize: '0.875rem', lineHeight: 1.6, mb: 2, '& p': { m: 0, mb: 0.5 }, '& ul, & ol': { pl: 2.5, my: 0.5 } }} dangerouslySetInnerHTML={{ __html: curriculum.description }} />
																	<Box sx={{ display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: 'divider', borderRadius: 0.5, overflow: 'hidden' }}>
																		{curriculum.lectures.map((lecture, index) => (
																			<Box key={lecture._id ?? index} sx={{ p: 1.5, borderTop: index > 0 ? '1px solid' : 'none', borderColor: 'divider', bgcolor: 'grey.50' }}>
																				<Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 0.75 }}>
																					<Typography variant='subtitle2' sx={{ fontWeight: 800, color: '#111827' }}>
																						{lecture.title}
																					</Typography>
																					<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
																						<Chip
																							icon={<CalendarTodayIcon sx={{ fontSize: 14 }} />}
																							label={formatLiveClassDate(lecture.day)}
																							size='small'
																							sx={{
																								bgcolor: '#e0f2fe',
																								color: '#075985',
																								fontWeight: 700,
																								borderRadius: 1,
																							}}
																						/>
																						<Chip icon={<AccessTimeIcon sx={{ fontSize: 14 }} />} label={formatLiveClassTime(lecture.time)} size='small' variant='outlined' />
																					</Box>
																				</Box>
																				{lecture.description && (
																					<Typography variant='body2' color='text.secondary'>
																						{lecture.description}
																					</Typography>
																				)}
																			</Box>
																		))}
																	</Box>
																	{quickAddingScId === curriculum._id && (
																		<Paper variant='outlined' sx={{ p: 1.5, mt: 1.5, borderRadius: 0.5 }}>
																			<Grid container spacing={1.25}>
																				<Grid size={{ xs: 12, sm: 6 }}>
																					<TextField
																						label='Class Title'
																						value={quickLectureForms[curriculum._id]?.title ?? ''}
																						onChange={(e) => setQuickLectureField(curriculum._id, 'title', e.target.value)}
																						fullWidth
																						size='small'
																					/>
																				</Grid>
																				<Grid size={{ xs: 6, sm: 3 }}>
																					<TextField
																						label='Class Date'
																						type='date'
																						value={quickLectureForms[curriculum._id]?.day ?? ''}
																						onChange={(e) => setQuickLectureField(curriculum._id, 'day', e.target.value)}
																						fullWidth
																						size='small'
																						slotProps={{ inputLabel: { shrink: true } }}
																					/>
																				</Grid>
																				<Grid size={{ xs: 6, sm: 3 }}>
																					<TextField
																						label='Class Time'
																						type='time'
																						value={quickLectureForms[curriculum._id]?.time ?? ''}
																						onChange={(e) => setQuickLectureField(curriculum._id, 'time', e.target.value)}
																						fullWidth
																						size='small'
																						slotProps={{ inputLabel: { shrink: true } }}
																					/>
																				</Grid>
																				<Grid size={{ xs: 12 }}>
																					<TextField
																						label='Description'
																						value={quickLectureForms[curriculum._id]?.description ?? ''}
																						onChange={(e) => setQuickLectureField(curriculum._id, 'description', e.target.value)}
																						fullWidth
																						size='small'
																						multiline
																						minRows={2}
																					/>
																				</Grid>
																			</Grid>
																			<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1.5 }}>
																				<Button size='small' onClick={() => setQuickAddingScId(null)}>
																					Cancel
																				</Button>
																				<Button size='small' variant='contained' onClick={() => void handleQuickAddLecture(curriculum)}>
																					Save Class
																				</Button>
																			</Box>
																		</Paper>
																	)}
																	{canManage && quickAddingScId !== curriculum._id && (
																		<Button
																			size='small'
																			startIcon={<AddIcon />}
																			sx={{ mt: 1.5 }}
																			onClick={() => startQuickAddLecture(curriculum._id)}
																		>
																			Add Class
																		</Button>
																	)}
																</>
															)}
														</Box>
														{canManage && !isEditing && (
															<Box sx={{ flexShrink: 0 }}>
																<ItemActionMenu
																	actions={[
																		{ label: 'Edit', icon: <EditOutlinedIcon fontSize='small' sx={{ mr: 1 }} />, onClick: () => startEditStudyCurriculum(curriculum) },
																		{ label: 'Delete', color: 'error', icon: <DeleteOutlinedIcon fontSize='small' sx={{ mr: 1 }} />, onClick: () => void handleDeleteStudyCurriculum(curriculum._id) },
																	]}
																/>
															</Box>
														)}
													</Box>
												</Paper>
											);
										})}
									</Box>
								)}
							</Box>
						)}

						{/* ── Study Materials ────────────────────────────── */}
						{activeNav === 'study_materials' && (
							<Box sx={{ p: 4, maxWidth: 800 }}>
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										mb: 3,
									}}
								>
									<Typography variant='h5' sx={{ fontWeight: 700 }}>
										Study Materials ({studyMaterials.length})
									</Typography>
									{canPost && (
										<Button
											variant='contained'
											startIcon={<AddIcon />}
											onClick={() => setShowSmForm((p) => !p)}
										>
											Add Material
										</Button>
									)}
								</Box>

								{/* Post form */}
								{canPost && showSmForm && (
									<Paper
										variant='outlined'
										sx={{ p: 2.5, mb: 3, borderRadius: 0.5 }}
									>
										<Typography
											variant='subtitle2'
											sx={{ fontWeight: 600, mb: 1.5 }}
										>
											New Study Material
										</Typography>
										<TextField
											label='Title'
											value={smForm.title}
											onChange={(e) =>
												setSmForm((p) => ({ ...p, title: e.target.value }))
											}
											fullWidth
											size='small'
											sx={{ mb: 1.5 }}
										/>
										<RichTextEditor
											value={smForm.description}
											onChange={(html) =>
												setSmForm((p) => ({ ...p, description: html }))
											}
											placeholder='Enter study material description...'
											minHeight={100}
										/>
										<TextField
											label='Resource Link (optional)'
											value={smForm.fileUrl}
											onChange={(e) =>
												setSmForm((p) => ({ ...p, fileUrl: e.target.value }))
											}
											fullWidth
											size='small'
											placeholder='https://...'
											sx={{ mb: 1.5 }}
										/>
										<Box
											sx={{
												display: 'flex',
												gap: 1,
												justifyContent: 'flex-end',
											}}
										>
											<Button
												size='small'
												onClick={() => {
													setShowSmForm(false);
													setSmForm({
														title: '',
														description: '',
														fileUrl: '',
													});
												}}
											>
												Cancel
											</Button>
											<Button
												size='small'
												variant='contained'
												onClick={() => void handlePostStudyMaterial()}
												disabled={smPosting}
											>
												{smPosting ? <CircularProgress size={16} /> : 'Add'}
											</Button>
										</Box>
									</Paper>
								)}

								{/* Materials list */}
								{studyMaterials.length === 0 ? (
									<Typography color='text.secondary'>
										No study materials available.
									</Typography>
								) : (
									<Box
										sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
									>
										{studyMaterials.map((mat) => {
											const canDelete =
												user?._id === mat.postedBy._id ||
												user?.role === 'Admin' ||
												user?.role === 'Super Admin' ||
												user?.role === 'Moderator';
											return (
												<Paper
													key={mat._id}
													variant='outlined'
													sx={{ p: 2.5, borderRadius: 0.5 }}
												>
													<Box
														sx={{
															display: 'flex',
															justifyContent: 'space-between',
															alignItems: 'flex-start',
														}}
													>
												<Box sx={{ flex: 1 }}>
															<Box
																sx={{
																	display: 'flex',
																	alignItems: 'center',
																	gap: 1,
																	mb: 1,
																}}
															>
																<Avatar
																	src={mat.postedBy.avatar}
																	sx={{
																		width: 22,
																		height: 22,
																		fontSize: 12,
																		bgcolor: 'primary.main',
																	}}
																>
																	{mat.postedBy.name[0]}
																</Avatar>
																<Typography
																	variant='caption'
																	color='text.secondary'
																>
																	{mat.postedBy.name}{' '}
																	{user?._id === mat.postedBy._id && <YouBadge />}{' '}
																	&bull; {mat.postedBy.role}{' '}
																	&bull;{' '}
																	{formatDateTime(mat.createdAt)}
																</Typography>
															</Box>
															{editingSmId === mat._id ? (
																<Box sx={{ mb: 2 }}>
																	<TextField
																		label='Title'
																		value={editingSmForm.title}
																		onChange={(e) =>
																			setEditingSmForm((p) => ({
																				...p,
																				title: e.target.value,
																			}))
																		}
																		fullWidth
																		size='small'
																		sx={{ mb: 1.5 }}
																	/>
																	<RichTextEditor
																		value={editingSmForm.description}
																		onChange={(html) =>
																			setEditingSmForm((p) => ({
																				...p,
																				description: html,
																			}))
																		}
																		placeholder='Update study material description...'
																		minHeight={100}
																	/>
																	<TextField
																		label='Resource Link (optional)'
																		value={editingSmForm.fileUrl}
																		onChange={(e) =>
																			setEditingSmForm((p) => ({
																				...p,
																				fileUrl: e.target.value,
																			}))
																		}
																		fullWidth
																		size='small'
																		sx={{ mt: 1.5 }}
																	/>
																	<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1.5 }}>
																		<Button
																			size='small'
																			onClick={() => setEditingSmId(null)}
																		>
																			Cancel
																		</Button>
																		<Button
																			size='small'
																			variant='contained'
																			onClick={() => void handleUpdateStudyMaterial()}
																			disabled={smUpdating}
																		>
																			{smUpdating ? <CircularProgress size={16} /> : 'Update'}
																		</Button>
																	</Box>
																</Box>
															) : (
																<>
																	<Typography
																		variant='subtitle1'
																		sx={{ fontWeight: 700, mb: 0.5 }}
																	>
																		{mat.title}
																	</Typography>
																	<Box
																		sx={{
																			fontSize: '0.875rem',
																			lineHeight: 1.6,
																			mb: mat.fileUrl ? 1 : 0,
																			'& p': { m: 0, mb: 0.5 },
																			'& ul, & ol': { pl: 2.5, my: 0.5 },
																		}}
																		dangerouslySetInnerHTML={{ __html: mat.description }}
																	/>
																	{mat.fileUrl && (
																		<Typography
																			component='a'
																			href={mat.fileUrl}
																			target='_blank'
																			rel='noopener noreferrer'
																			variant='body2'
																			sx={{
																				color: 'primary.main',
																				textDecoration: 'none',
																				'&:hover': { textDecoration: 'underline' },
																			}}
																		>
																			Open Resource &rarr;
																		</Typography>
																	)}
																</>
															)}
														</Box>
														<Box sx={{ ml: 1, flexShrink: 0 }}>
															{canDelete && (
																<ItemActionMenu
																	actions={[
																		{
																			label: 'Edit',
																			icon: (
																				<EditOutlinedIcon
																					fontSize='small'
																					sx={{ mr: 1 }}
																				/>
																			),
																			onClick: () => startEditStudyMaterial(mat),
																		},
																		{
																			label: 'Delete',
																			color: 'error',
																			icon: (
																				<DeleteOutlinedIcon
																					fontSize='small'
																					sx={{ mr: 1 }}
																				/>
																			),
																			onClick: () =>
																				void handleDeleteStudyMaterial(mat._id),
																		},
																	]}
																/>
															)}
														</Box>
													</Box>
												</Paper>
											);
										})}
									</Box>
								)}
							</Box>
						)}

					{/* ── Q & A ──────────────────────────────────────── */}
					{activeNav === 'students' && canSeeStudentList && (
						<Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 980 }}>
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: { xs: 'flex-start', sm: 'center' },
									gap: 2,
									mb: 3,
									flexDirection: { xs: 'column', sm: 'row' },
								}}
							>
								<Box>
									<Typography variant='h5' sx={{ fontWeight: 700 }}>
										Enrolled Students ({courseStudents.length})
									</Typography>
									<Typography variant='body2' color='text.secondary'>
										Students currently enrolled in this course.
									</Typography>
								</Box>
								{canExportStudentList && (
									<Button
										variant='contained'
										startIcon={
											studentsExporting ? (
												<CircularProgress size={16} color='inherit' />
											) : (
												<DownloadOutlinedIcon />
											)
										}
										onClick={() => void handleExportStudents()}
										disabled={studentsExporting || courseStudents.length === 0}
									>
										Export CSV
									</Button>
								)}
							</Box>

							<Paper
								elevation={0}
								sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
							>
								{studentsLoading ? (
									<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
										<CircularProgress size={28} />
									</Box>
								) : courseStudents.length === 0 ? (
									<Box sx={{ py: 6, textAlign: 'center' }}>
										<Typography color='text.secondary'>
											No students enrolled in this course yet.
										</Typography>
									</Box>
								) : (
									<TableContainer>
										<Table size='small'>
											<TableHead>
												<TableRow>
													<TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
													{user?.role !== 'Teacher' && (
														<TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
													)}
													<TableCell sx={{ fontWeight: 700 }}>Enroll Date</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{courseStudents.map((enrollment) => (
													<TableRow key={enrollment._id} hover>
														<TableCell>
															<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
																<Avatar
																	src={enrollment.student.avatar}
																	sx={{ width: 32, height: 32, fontSize: 13 }}
																>
																	{enrollment.student.name?.[0]}
																</Avatar>
																<Typography variant='body2' sx={{ fontWeight: 600 }}>
																	{enrollment.student.name}
																</Typography>
															</Box>
														</TableCell>
														{user?.role !== 'Teacher' && (
															<TableCell>
																<Typography variant='body2' color='text.secondary'>
																	{enrollment.student.email ?? '-'}
																</Typography>
															</TableCell>
														)}
														<TableCell>
															<Typography variant='body2' color='text.secondary'>
																{formatDateTime(enrollment.createdAt)}
															</Typography>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								)}
							</Paper>
						</Box>
					)}

					{activeNav === 'qa' && (
						<Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 860 }}>
							<CourseQASection
								courseId={courseId!}
								canPost={canPostQA}
								userId={user?._id ?? ''}
								userRole={user?.role ?? ''}
								initialQuestionId={initialQuestionId}
							/>
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
									{course.sections?.length ?? 0} section
									{(course.sections?.length ?? 0) !== 1 ? 's' : ''} &bull;{' '}
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
											<Typography
												sx={{
													fontWeight: 600,
													fontSize: '0.82rem',
													lineHeight: 1.3,
												}}
											>
												{section.title}
											</Typography>
											<Typography variant='caption' color='text.secondary'>
												{section.lectures.length} lecture
												{section.lectures.length !== 1 ? 's' : ''}
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
													onClick={() => {
														if (hasVideo) setActiveLecture(lecture);
													}}
													sx={{
														display: 'flex',
														alignItems: 'flex-start',
														gap: 1.25,
														px: 2,
														py: 1.25,
														cursor: hasVideo ? 'pointer' : 'default',
														borderTop: li > 0 ? '1px solid' : 'none',
														borderColor: 'divider',
														bgcolor: isActive
															? 'primary.50'
															: 'background.paper',
														transition: 'background 0.15s',
														...(hasVideo &&
															!isActive && {
																'&:hover': { bgcolor: 'action.hover' },
															}),
													}}
												>
													{isActive ? (
														<PlayCircleFilledIcon
															sx={{
																fontSize: 18,
																color: 'primary.main',
																flexShrink: 0,
																mt: 0.15,
															}}
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
																color: isActive
																	? 'primary.main'
																	: hasVideo
																		? 'text.primary'
																		: 'text.disabled',
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
														{lecture.duration !== null &&
															lecture.duration !== undefined && (
															<Typography
																variant='caption'
																color='text.secondary'
															>
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
			{!isTeacherOrAdmin && <ChatWidget />}
		</Box>
	);
}


// ── Stat card ─────────────────────────────────────────────────
function StatItem({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
}) {
	return (
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
			<Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
			<Box>
				<Typography
					sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.15 }}
				>
					{value}
				</Typography>
				<Typography variant='caption' color='text.secondary'>
					{label}
				</Typography>
			</Box>
		</Box>
	);
}

function CurriculumLectureFields({
	lectures,
	onAdd,
	onRemove,
	onChange,
}: {
	lectures: IStudyCurriculumLecture[];
	onAdd: () => void;
	onRemove: (index: number) => void;
	onChange: (
		index: number,
		field: keyof IStudyCurriculumLecture,
		value: string,
	) => void;
}) {
	return (
		<Box sx={{ mt: 2 }}>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					mb: 1,
				}}
			>
				<Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
					Classes
				</Typography>
				<Button size='small' startIcon={<AddIcon />} onClick={onAdd}>
					Add Class
				</Button>
			</Box>
			{lectures.map((lecture, index) => (
				<Paper
					key={lecture._id ?? index}
					variant='outlined'
					sx={{ p: 1.5, mb: 1.5, borderRadius: 0.5 }}
				>
					<Grid container spacing={1.25}>
						<Grid size={{ xs: 12, sm: 6 }}>
							<TextField
								label='Class Title'
								value={lecture.title}
								onChange={(e) => onChange(index, 'title', e.target.value)}
								fullWidth
								size='small'
							/>
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<TextField
								label='Class Date'
								type='date'
								value={lecture.day}
								onChange={(e) => onChange(index, 'day', e.target.value)}
								fullWidth
								size='small'
								slotProps={{ inputLabel: { shrink: true } }}
							/>
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<TextField
								label='Class Time'
								type='time'
								value={lecture.time}
								onChange={(e) => onChange(index, 'time', e.target.value)}
								fullWidth
								size='small'
								slotProps={{ inputLabel: { shrink: true } }}
							/>
						</Grid>
						<Grid size={{ xs: 12 }}>
							<TextField
								label='Description'
								value={lecture.description ?? ''}
								onChange={(e) => onChange(index, 'description', e.target.value)}
								fullWidth
								size='small'
								multiline
								minRows={2}
							/>
						</Grid>
					</Grid>
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
						<Button size='small' color='error' onClick={() => onRemove(index)}>
							Remove Class
						</Button>
					</Box>
				</Paper>
			))}
		</Box>
	);
}


