import { Box, PaginationItem, Typography } from '@mui/material';

interface AppPaginationProps {
	page: number;
	totalPages: number;
	totalItems?: number;
	pageSize?: number;
	onChange: (page: number) => void;
	disabled?: boolean;
	boundaryCount?: number;
	middleCount?: number;
	align?: 'space-between' | 'center';
	getItemSx?: (page: number) => any;
}

export default function AppPagination({
	page,
	totalPages,
	totalItems,
	pageSize,
	onChange,
	disabled = false,
	boundaryCount = 1,
	middleCount = 3,
	align = 'space-between',
	getItemSx,
}: AppPaginationProps) {
	if (totalPages <= 1) return null;

	const start =
		totalItems && pageSize ? Math.min((page - 1) * pageSize + 1, totalItems) : 0;
	const end =
		totalItems && pageSize ? Math.min(page * pageSize, totalItems) : 0;
	const safeMiddleCount = Math.max(middleCount, 1);

	const getPageItems = () => {
		if (totalPages <= boundaryCount * 2 + safeMiddleCount) {
			return Array.from({ length: totalPages }, (_, index) => index + 1);
		}

		const firstMiddlePage = boundaryCount + 1;
		const lastMiddlePage = totalPages - boundaryCount;
		const halfWindow = Math.floor(safeMiddleCount / 2);
		let start = Math.max(page - halfWindow, firstMiddlePage);
		const end = Math.min(start + safeMiddleCount - 1, lastMiddlePage);

		start = Math.max(end - safeMiddleCount + 1, firstMiddlePage);

		const items: Array<number | 'start-ellipsis' | 'end-ellipsis'> = [];

		for (let current = 1; current <= boundaryCount; current += 1) {
			items.push(current);
		}

		if (start > boundaryCount + 1) {
			items.push('start-ellipsis');
		}

		for (let current = start; current <= end; current += 1) {
			items.push(current);
		}

		if (end < totalPages - boundaryCount) {
			items.push('end-ellipsis');
		}

		for (
			let current = totalPages - boundaryCount + 1;
			current <= totalPages;
			current += 1
		) {
			items.push(current);
		}

		return items;
	};

	const pageItems = getPageItems();
	const isCentered = align === 'center';
	const itemSx = {
		minWidth: 36,
		height: 36,
		borderRadius: 1,
		fontWeight: 800,
		fontSize: '0.875rem',
		border: '1px solid',
		borderColor: 'divider',
		bgcolor: 'background.paper',
		color: 'text.secondary',
		transition: 'background-color 160ms ease, border-color 160ms ease, color 160ms ease',
		'&:hover': {
			bgcolor: 'action.hover',
			borderColor: 'primary.light',
			color: 'primary.main',
		},
		'&.Mui-selected': {
			bgcolor: 'primary.main',
			borderColor: 'primary.main',
			color: 'primary.contrastText',
			boxShadow: '0 8px 18px rgba(21, 101, 192, 0.22)',
			'&:hover': {
				bgcolor: 'primary.dark',
				borderColor: 'primary.dark',
			},
		},
		'&.Mui-disabled': {
			bgcolor: 'grey.50',
			borderColor: 'divider',
			color: 'text.disabled',
			opacity: 1,
		},
	};

	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: isCentered ? 'center' : 'space-between',
				gap: isCentered ? 1.5 : 2,
				flexWrap: 'wrap',
				mt: 2,
				px: isCentered ? 1.5 : 0,
				py: isCentered ? 1.5 : 0,
				borderTop: isCentered ? '1px solid' : 'none',
				borderColor: 'divider',
			}}
		>
			{totalItems && pageSize ? (
				<Typography
					variant='body2'
					color='text.secondary'
					sx={
						isCentered
							? {
									width: '100%',
									textAlign: 'center',
									fontWeight: 750,
									letterSpacing: 0,
								}
							: { fontWeight: 650 }
					}
				>
					Showing {start}-{end} of {totalItems}
				</Typography>
			) : (
				<Box />
			)}
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 0.75,
					p: 0.5,
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: 1,
					bgcolor: 'background.paper',
					boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
					maxWidth: '100%',
					overflowX: 'auto',
				}}
			>
				<PaginationItem
					type='previous'
					shape='rounded'
					disabled={disabled || page <= 1}
					onClick={() => onChange(page - 1)}
					sx={itemSx}
				/>
				{pageItems.map((item) =>
					typeof item === 'number' ? (
						<PaginationItem
							key={item}
							page={item}
							type='page'
							color='primary'
							shape='rounded'
							selected={item === page}
							disabled={disabled}
							onClick={() => onChange(item)}
							sx={{ ...itemSx, ...(getItemSx ? getItemSx(item) : {}) }}
						/>
					) : (
						<PaginationItem
							key={item}
							type={item}
							shape='rounded'
							disabled
							sx={{
								...itemSx,
								borderColor: 'transparent',
								bgcolor: 'transparent',
								minWidth: 28,
							}}
						/>
					),
				)}
				<PaginationItem
					type='next'
					shape='rounded'
					disabled={disabled || page >= totalPages}
					onClick={() => onChange(page + 1)}
					sx={itemSx}
				/>
			</Box>
		</Box>
	);
}
