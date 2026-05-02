import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthLayout from './components/layout/AuthLayout';
import AdminLayout from './components/layout/AdminLayout/AdminLayout';
import StudentLayout from './components/layout/StudentLayout/StudentLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import CoursesPage from './pages/courses/CoursesPage';
import CourseCreatePage from './pages/courses/CourseCreatePage';
import CourseDetailPage from './pages/courses/CourseDetailPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import TeachersPage from './pages/teachers/TeachersPage';
import UsersPage from './pages/users/UsersPage';
import SubscriptionsPage from './pages/subscriptions/SubscriptionsPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';

const ADMIN_ROLES = ['Super Admin', 'Admin', 'Moderator', 'Teacher'] as const;

export default function App() {
	return (
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
					<Route path='/admin/dashboard' element={<DashboardPage />} />{' '}
					<Route path='/admin/profile' element={<ProfilePage />} />{' '}
					<Route path='/admin/courses' element={<CoursesPage />} />
					<Route path='/admin/courses/create' element={<CourseCreatePage />} />
					<Route path='/admin/courses/:id' element={<CourseDetailPage />} />
					<Route
						path='/admin/courses/:id/edit'
						element={<CourseCreatePage />}
					/>
					<Route path='/admin/categories' element={<CategoriesPage />} />
					<Route path='/admin/teachers' element={<TeachersPage />} />
					<Route path='/admin/students' element={<UsersPage />} />
					<Route path='/admin/subscriptions' element={<SubscriptionsPage />} />
				</Route>
			</Route>

			{/* Student routes */}
			<Route element={<ProtectedRoute allowedRoles={['Student']} />}>
				<Route element={<StudentLayout />}>
					<Route path='/student/dashboard' element={<DashboardPage />} />{' '}
					<Route path='/student/profile' element={<ProfilePage />} />{' '}
					<Route path='/student/courses' element={<CoursesPage />} />
				</Route>
			</Route>

			{/* Public routes */}
			<Route path='/courses/:id' element={<CourseDetailPage />} />

			<Route path='*' element={<NotFoundPage />} />
		</Routes>
	);
}
