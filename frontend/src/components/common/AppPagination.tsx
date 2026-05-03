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
		let end = Math.min(start + safeMiddleCount - 1, lastMiddlePage);

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

	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: 2,
				flexWrap: 'wrap',
				mt: 4,
			}}
		>
			{totalItems && pageSize ? (
				<Typography variant='body2' color='text.secondary'>
					Showing {start}-{end} of {totalItems}
				</Typography>
			) : (
				<Box />
			)}
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
				<PaginationItem
					type='previous'
					shape='rounded'
					disabled={disabled || page <= 1}
					onClick={() => onChange(page - 1)}
					sx={{ fontWeight: 700, borderRadius: 1 }}
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
							sx={{ fontWeight: 700, borderRadius: 1 }}
						/>
					) : (
						<PaginationItem
							key={item}
							type={item}
							shape='rounded'
							disabled
							sx={{ fontWeight: 700, borderRadius: 1 }}
						/>
					),
				)}
				<PaginationItem
					type='next'
					shape='rounded'
					disabled={disabled || page >= totalPages}
					onClick={() => onChange(page + 1)}
					sx={{ fontWeight: 700, borderRadius: 1 }}
				/>
			</Box>
		</Box>
	);
}
