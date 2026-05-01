import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
	Box,
	Button,
	TextField,
	Typography,
	Link,
	CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/useAuth';

export default function RegisterPage() {
	const { t } = useTranslation();
	const { register } = useAuth();
	const navigate = useNavigate();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			await register(name, email, password);
			navigate('/student/dashboard', { replace: true });
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box component='form' onSubmit={(e) => void handleSubmit(e)}>
			<Typography
				variant='h5'
				sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}
			>
				{t('auth.registerTitle')}
			</Typography>
			<TextField
				label={t('auth.name')}
				fullWidth
				required
				value={name}
				onChange={(e) => setName(e.target.value)}
				sx={{ mb: 2 }}
			/>
			<TextField
				label={t('auth.email')}
				type='email'
				fullWidth
				required
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				sx={{ mb: 2 }}
			/>
			<TextField
				label={t('auth.password')}
				type='password'
				fullWidth
				required
				slotProps={{ htmlInput: { minLength: 6 } }}
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				sx={{ mb: 3 }}
			/>
			<Button
				type='submit'
				variant='contained'
				fullWidth
				size='large'
				disabled={loading}
			>
				{loading ? (
					<CircularProgress size={22} color='inherit' />
				) : (
					t('auth.register')
				)}
			</Button>
			<Typography variant='body2' sx={{ textAlign: 'center', mt: 2 }}>
				{t('auth.hasAccount')}{' '}
				<Link component={RouterLink} to='/auth/login'>
					{t('auth.login')}
				</Link>
			</Typography>
		</Box>
	);
}
