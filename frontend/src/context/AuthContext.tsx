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
		setUser(res.data ?? null);
		toast.success('Logged in successfully');
	};

	const register = async (name: string, email: string, password: string) => {
		const res = await authService.register(name, email, password);
		setUser(res.data ?? null);
		toast.success('Account created successfully');
	};

	const logout = async () => {
		await authService.logout();
		setUser(null);
		toast.success('Logged out successfully');
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
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
