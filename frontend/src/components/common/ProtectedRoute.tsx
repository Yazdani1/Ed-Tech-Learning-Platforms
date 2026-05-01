import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import LoadingSpinner from './LoadingSpinner';
import type { UserRole } from '../../types/index';

interface ProtectedRouteProps {
	allowedRoles?: UserRole[];
	redirectTo?: string;
}

export default function ProtectedRoute({
	allowedRoles,
	redirectTo = '/auth/login',
}: ProtectedRouteProps) {
	const { user, isLoading, isAuthenticated } = useAuth();

	if (isLoading) return <LoadingSpinner />;
	if (!isAuthenticated) return <Navigate to={redirectTo} replace />;
	if (allowedRoles && user && !allowedRoles.includes(user.role)) {
		return <Navigate to='/unauthorized' replace />;
	}

	return <Outlet />;
}
