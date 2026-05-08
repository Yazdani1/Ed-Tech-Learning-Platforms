import { useEffect, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import type { IUser } from '../types/index';
import { AuthContext } from './AuthContextCore';

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<IUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		authService
			.getMe()
			.then((res) => setUser(res.data ?? null))
			.catch(() => setUser(null))
			.finally(() => setIsLoading(false));
	}, []);

	const login = async (email: string, password: string) => {
		const res = await authService.login(email, password);
		if (res.token) localStorage.setItem('authToken', res.token);
		const userData = res.data ?? null;
		setUser(userData);
		toast.success('Logged in successfully');
		return userData;
	};

	const register = async (name: string, email: string, password: string) => {
		const res = await authService.register(name, email, password);
		if (res.token) localStorage.setItem('authToken', res.token);
		const userData = res.data ?? null;
		setUser(userData);
		toast.success('Account created successfully');
		return userData;
	};

	const logout = async () => {
		await authService.logout();
		localStorage.removeItem('authToken');
		setUser(null);
		toast.success('Logged out successfully');
	};

	const refreshUser = async () => {
		const res = await authService.getMe();
		setUser(res.data ?? null);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				isLoading,
				isAuthenticated: !!user,
				login,
				register,
				logout,
				refreshUser,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
