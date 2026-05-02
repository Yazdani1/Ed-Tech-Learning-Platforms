import {
	Box,
	Paper,
	Avatar,
	Typography,
	Divider,
	Grid,
	Chip,
} from '@mui/material';
import { useAuth } from '../../context/useAuth';

export default function ProfilePage() {
	const { user } = useAuth();

	if (!user) {
		return (
			<Box>
				<Typography variant='h5' sx={{ fontWeight: 700, mb: 2 }}>
					My Profile
				</Typography>
				<Typography color='text.secondary'>Loading profile...</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>
				My Profile
			</Typography>
			<Typography variant='body1' color='text.secondary' sx={{ mb: 4 }}>
				Review your account details and membership information.
			</Typography>

			<Paper
				elevation={0}
				sx={{
					p: 4,
					borderRadius: 3,
					border: '1px solid',
					borderColor: 'divider',
					mb: 4,
				}}
			>
				<Box
					sx={{
						display: 'flex',
						gap: 3,
						alignItems: 'center',
						mb: 4,
						flexWrap: 'wrap',
					}}
				>
					<Avatar
						sx={{
							width: 96,
							height: 96,
							fontSize: 32,
							bgcolor: 'primary.main',
						}}
						alt={user.name}
						src={user.avatar}
					>
						{user.name?.[0]?.toUpperCase()}
					</Avatar>
					<Box>
						<Typography variant='h5' sx={{ fontWeight: 700 }}>
							{user.name}
						</Typography>
						<Typography variant='body2' color='text.secondary'>
							{user.email}
						</Typography>
						<Chip label={user.role} size='small' sx={{ mt: 1 }} />
					</Box>
				</Box>

				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
					<Chip
						label={`Joined: ${new Date(user.createdAt).toLocaleDateString()}`}
					/>
					<Chip
						label={`Courses purchased: ${user.purchasedCourses?.length ?? 0}`}
					/>
					{user.activeSubscription && (
						<Chip
							label={`Subscription: ${user.activeSubscription.plan}`}
							color='success'
						/>
					)}
				</Box>
			</Paper>

			<Paper
				elevation={0}
				sx={{
					p: 3,
					borderRadius: 3,
					border: '1px solid',
					borderColor: 'divider',
				}}
			>
				<Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
					Account details
				</Typography>
				<Grid container spacing={2}>
					<Grid item xs={12} sm={6} md={4}>
						<Typography variant='subtitle2' color='text.secondary'>
							Name
						</Typography>
						<Typography>{user.name}</Typography>
					</Grid>
					<Grid item xs={12} sm={6} md={4}>
						<Typography variant='subtitle2' color='text.secondary'>
							Email
						</Typography>
						<Typography>{user.email}</Typography>
					</Grid>
					<Grid item xs={12} sm={6} md={4}>
						<Typography variant='subtitle2' color='text.secondary'>
							Role
						</Typography>
						<Typography>{user.role}</Typography>
					</Grid>
					<Grid item xs={12} sm={6} md={4}>
						<Typography variant='subtitle2' color='text.secondary'>
							Joined
						</Typography>
						<Typography>
							{new Date(user.createdAt).toLocaleDateString()}
						</Typography>
					</Grid>
					<Grid item xs={12} sm={6} md={4}>
						<Typography variant='subtitle2' color='text.secondary'>
							Purchased courses
						</Typography>
						<Typography>{user.purchasedCourses?.length ?? 0}</Typography>
					</Grid>
					{user.activeSubscription && (
						<Grid item xs={12} sm={6} md={4}>
							<Typography variant='subtitle2' color='text.secondary'>
								Subscription
							</Typography>
							<Typography>
								{user.activeSubscription.plan} •{' '}
								{new Date(
									user.activeSubscription.startDate,
								).toLocaleDateString()}{' '}
								-{' '}
								{new Date(user.activeSubscription.endDate).toLocaleDateString()}
							</Typography>
						</Grid>
					)}
				</Grid>
			</Paper>
		</Box>
	);
}
