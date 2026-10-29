import { type FC, type ReactNode } from 'react';
import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material';

export interface DetailItemProps {
	label: string;
	value: ReactNode;
}

export const DetailItem: FC<DetailItemProps> = ({ label, value }) => {
	return (
		<Box
			sx={{
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: 1,
				px: 1.5,
				py: 1.25,
				minWidth: 0,
			}}
		>
			<Typography variant='caption' color='text.secondary' sx={{ fontWeight: 750 }}>
				{label}
			</Typography>
			<Box
				sx={{
					mt: 0.5,
					fontSize: '0.925rem',
					fontWeight: 650,
					color: 'text.primary',
					overflowWrap: 'anywhere',
				}}
			>
				{value}
			</Box>
		</Box>
	);
};

export const UserCardSkeleton = () => {
	return (
		<Card
			elevation={0}
			sx={{
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: 1,
				height: '100%',
			}}
		>
			<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: {
							xs: 'minmax(0, 1fr) auto',
							sm: 'minmax(0, 1.25fr) minmax(120px, 0.55fr) minmax(130px, 0.65fr) auto',
						},
						alignItems: 'center',
						columnGap: 2,
						rowGap: 1.5,
					}}
				>
					<Box sx={{ minWidth: 0 }}>
						<Skeleton animation='wave' variant='text' sx={{ fontSize: '1.1rem', width: '78%' }} />
						<Skeleton animation='wave' variant='text' sx={{ fontSize: '0.875rem', width: '92%', mt: 0.35 }} />
					</Box>

					<Box sx={{ minWidth: 0, gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
							<Skeleton animation='wave' variant='text' sx={{ fontSize: '0.875rem', width: 34 }} />
							<Skeleton animation='wave' variant='rounded' width={82} height={24} sx={{ borderRadius: 1 }} />
						</Box>
					</Box>

					<Box sx={{ minWidth: 0, gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
						<Skeleton animation='wave' variant='text' sx={{ fontSize: '0.9rem', width: '88%' }} />
					</Box>

					<Box sx={{ justifySelf: 'end', gridColumn: { xs: '2', sm: 'auto' }, gridRow: { xs: '1', sm: 'auto' } }}>
						<Skeleton animation='wave' variant='rounded' width={34} height={34} sx={{ borderRadius: 1 }} />
					</Box>
				</Box>
			</CardContent>
		</Card>
	);
};
