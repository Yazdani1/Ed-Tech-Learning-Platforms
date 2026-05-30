import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthLayout from './components/layout/AuthLayout';
import AdminLayout from './components/layout/AdminLayout/AdminLayout';
import StudentLayout from './components/layout/StudentLayout/StudentLayout';
import TeacherLayout from './components/layout/TeacherLayout/TeacherLayout';
import LoadingSpinner from './components/common/LoadingSpinner';
import { ConfirmModalProvider } from './context/ConfirmModalContext';
import { ChatProvider } from './context/ChatContext';
import { NotificationProvider } from './context/NotificationContext';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage'));
const CoursesPage = lazy(() => import('./pages/courses/CoursesPage'));
const CourseCreatePage = lazy(() => import('./pages/courses/CourseCreatePage'));
const CourseDetailPage = lazy(() => import('./pages/courses/CourseDetailPage'));
const CategoriesPage = lazy(() => import('./pages/categories/CategoriesPage'));
const CourseTypesPage = lazy(() => import('./pages/courseTypes/CourseTypesPage'));
const TeachersPage = lazy(() => import('./pages/teachers/TeachersPage'));
const UsersPage = lazy(() => import('./pages/users/UsersPage'));
const SubscriptionsPage = lazy(() => import('./pages/subscriptions/SubscriptionsPage'));
const AdminEnrollmentsPage = lazy(() => import('./pages/enrollments/AdminEnrollmentsPage'));
const PerformancePage = lazy(() => import('./pages/performance/PerformancePage'));
const AdminCourseQAPage = lazy(() => import('./pages/qa/AdminCourseQAPage'));
const StudentCourseLearningPage = lazy(() => import('./pages/courses/StudentCourseLearningPage'));
const TeacherCoursesPage = lazy(() => import('./pages/courses/TeacherCoursesPage'));
const PricingPage = lazy(() => import('./pages/pricing/PricingPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const CourseBrowsePage = lazy(() => import('./pages/courses/CourseBrowsePage'));
const FreeCoursesPage = lazy(() => import('./pages/courses/FreeCoursesPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const PracticeQuizPage = lazy(() => import('./pages/quiz/PracticeQuizPage'));
const PublicTeachersPage = lazy(() => import('./pages/teachers/PublicTeachersPage'));
const StaffChatPage = lazy(() => import('./pages/chat/StaffChatPage'));
const StudentChatPage = lazy(() => import('./pages/chat/StudentChatPage'));
const GroupChatPage = lazy(() => import('./pages/chat/GroupChatPage'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
const HomeHeroPostsPage = lazy(() => import('./pages/homeHero/HomeHeroPostsPage'));
const CommunityHubPage = lazy(() => import('./pages/community/CommunityHubPage'));
const CommunityDiscussionDetailPage = lazy(() => import('./pages/community/CommunityDiscussionDetailPage'));
const CommunityUserProfilePage = lazy(() => import('./pages/community/CommunityUserProfilePage'));
const StudySchedulePage = lazy(() => import('./pages/studySchedule/StudySchedulePage'));

const ADMIN_ROLES = ['Super Admin', 'Admin', 'Moderator'] as const;

const App= () => {
	return (
		<ConfirmModalProvider>
			<ChatProvider>
			<NotificationProvider>
			<Suspense fallback={<LoadingSpinner />}>
				<Routes>
				<Route path='/' element={<HomePage />} />

			{/* Auth */}
			<Route element={<AuthLayout />}>
				<Route path='/auth/login' element={<LoginPage />} />
				<Route path='/auth/register' element={<RegisterPage />} />
			</Route>

			{/* Admin routes */}
			<Route element={<ProtectedRoute allowedRoles={[...ADMIN_ROLES]} />}>
				<Route element={<AdminLayout />}>
					<Route element={<ProtectedRoute allowedRoles={['Super Admin']} unauthorizedTo='/admin/courses' />}>
						<Route path='/admin/dashboard' element={<DashboardPage />} />
					</Route>
					<Route path='/admin/profile' element={<ProfilePage />} />{' '}
					<Route path='/admin/courses' element={<CoursesPage />} />
					<Route path='/admin/courses/create' element={<CourseCreatePage />} />
					<Route path='/admin/courses/:id' element={<CourseDetailPage />} />
					<Route
						path='/admin/courses/:id/edit'
						element={<CourseCreatePage />}
					/>
					<Route element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin']} />}>
						<Route path='/admin/categories' element={<CategoriesPage />} />
						<Route path='/admin/course-types' element={<CourseTypesPage />} />
						<Route path='/admin/homepage-showcase' element={<HomeHeroPostsPage />} />
					</Route>
					<Route path='/admin/teachers' element={<TeachersPage />} />
					<Route path='/admin/users' element={<UsersPage />} />
					<Route path='/admin/subscriptions' element={<SubscriptionsPage />} />
					<Route path='/admin/enrollments/:courseId' element={<AdminEnrollmentsPage />} />
					<Route path='/admin/course-qa' element={<AdminCourseQAPage />} />
					<Route path='/admin/performance' element={<PerformancePage />} />
					<Route path='/admin/courses/:courseId/learn' element={<StudentCourseLearningPage />} />
					<Route path='/admin/chat' element={<StaffChatPage />} />
					<Route path='/admin/group-chat' element={<GroupChatPage />} />
					<Route path='/admin/notifications' element={<NotificationsPage />} />
					<Route path='/admin/schedule' element={<StudySchedulePage />} />
				</Route>
			</Route>

			{/* Student routes */}
			<Route element={<ProtectedRoute allowedRoles={['Student']} />}>
				{/* Full-screen learning page — no StudentLayout sidebar */}
				<Route path='/student/courses/:courseId/learn' element={<StudentCourseLearningPage />} />
				<Route element={<StudentLayout />}>
					<Route path='/student/dashboard' element={<DashboardPage />} />{' '}
					<Route path='/student/profile' element={<ProfilePage />} />{' '}
					<Route path='/student/courses' element={<CoursesPage />} />
					<Route path='/student/chat' element={<StudentChatPage />} />
					<Route path='/student/group-chat' element={<GroupChatPage />} />
					<Route path='/student/notifications' element={<NotificationsPage />} />
					<Route path='/student/schedule' element={<StudySchedulePage />} />
				</Route>
			</Route>

			{/* Teacher routes */}
			<Route element={<ProtectedRoute allowedRoles={['Teacher']} />}>
				<Route element={<TeacherLayout />}>
					<Route path='/teacher/profile' element={<ProfilePage />} />
					<Route path='/teacher/courses' element={<TeacherCoursesPage />} />
					<Route path='/teacher/courses/:courseId/learn' element={<StudentCourseLearningPage />} />
					<Route path='/teacher/chat' element={<StaffChatPage />} />
					<Route path='/teacher/notifications' element={<NotificationsPage />} />
					<Route path='/teacher/schedule' element={<StudySchedulePage />} />
				</Route>
			</Route>

			{/* Public routes */}
			<Route path='/pricing' element={<PricingPage />} />
			<Route path='/courses' element={<CourseBrowsePage />} />
			<Route path='/free-courses' element={<FreeCoursesPage />} />
			<Route path='/courses/:id' element={<CourseDetailPage />} />
			<Route path='/teachers' element={<PublicTeachersPage />} />
			<Route path='/practice-quiz' element={<PracticeQuizPage />} />
			<Route path='/community-hub' element={<CommunityHubPage />} />
			<Route path='/community-hub/users/:userId' element={<CommunityUserProfilePage />} />
			<Route path='/community-hub/:postId' element={<CommunityDiscussionDetailPage />} />

			<Route path='*' element={<NotFoundPage />} />
				</Routes>
			</Suspense>
			</NotificationProvider>
			</ChatProvider>
		</ConfirmModalProvider>
	);
};

export default App;
