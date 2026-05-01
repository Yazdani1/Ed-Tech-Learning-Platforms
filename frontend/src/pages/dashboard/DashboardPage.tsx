import { Box, Typography, Paper } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../../context/useAuth';

const statCards = [
	{
		label: 'Total Courses',
		value: '—',
		icon: <SchoolIcon color='primary' fontSize='large' />,
	},
	{
		label: 'Total Students',
		value: '—',
		icon: <PeopleIcon color='secondary' fontSize='large' />,
	},
	{
		label: 'Categories',
		value: '—',
		icon: <CategoryIcon sx={{ color: 'success.main' }} fontSize='large' />,
	},
	{
		label: 'Teachers',
		value: '—',
		icon: <PersonIcon sx={{ color: 'warning.main' }} fontSize='large' />,
	},
];

export default function DashboardPage() {
	const { user } = useAuth();

	return (
		<Box>
			<Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>
				Dashboard
			</Typography>
			<Typography variant='body1' color='text.secondary' sx={{ mb: 4 }}>
				Welcome back, {user?.name} 👋
			</Typography>

			<Box
				sx={{
					display: 'grid',
					gap: 3,
					gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
				}}
			>
				{statCards.map((card) => (
					<Box key={card.label}>
						<Paper
							elevation={0}
							sx={{
								p: 3,
								borderRadius: 3,
								border: '1px solid',
								borderColor: 'divider',
								display: 'flex',
								alignItems: 'center',
								gap: 2,
							}}
						>
							{card.icon}
							<Box>
								<Typography variant='h5' sx={{ fontWeight: 700 }}>
									{card.value}
								</Typography>
								<Typography variant='body2' color='text.secondary'>
									{card.label}
								</Typography>
							</Box>
						</Paper>
					</Box>
				))}
			</Box>
		</Box>
	);
}
