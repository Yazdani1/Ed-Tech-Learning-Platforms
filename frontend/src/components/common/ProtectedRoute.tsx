import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import LoadingSpinner from './LoadingSpinner';
import type { UserRole } from '../../types/index';

interface ProtectedRouteProps {
	allowedRoles?: UserRole[];
	redirectTo?: string;
	unauthorizedTo?: string;
}

export default function ProtectedRoute({
	allowedRoles,
	redirectTo = '/auth/login',
	unauthorizedTo = '/unauthorized',
}: ProtectedRouteProps) {
	const { user, isLoading, isAuthenticated } = useAuth();

	if (isLoading) return <LoadingSpinner />;
	if (!isAuthenticated) return <Navigate to={redirectTo} replace />;
	if (allowedRoles && user && !allowedRoles.includes(user.role)) {
		return <Navigate to={unauthorizedTo} replace />;
	}

	return <Outlet />;
}
