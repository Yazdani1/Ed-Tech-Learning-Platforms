import { createContext } from 'react';
import type { IUser } from '../types/index';

interface AuthContextType {
	user: IUser | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<IUser | null>;
	register: (
		name: string,
		email: string,
		password: string,
	) => Promise<IUser | null>;
	logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
	undefined,
);
