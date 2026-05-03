import { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export interface ItemAction {
	label: string;
	icon?: React.ReactNode;
	color?: 'inherit' | 'error';
	onClick: () => void;
}

export default function ItemActionMenu({ actions }: { actions: ItemAction[] }) {
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

	if (actions.length === 0) return null;

	const close = () => setAnchorEl(null);

	return (
		<>
			<IconButton
				size='small'
				onClick={(event) => {
					event.stopPropagation();
					setAnchorEl(event.currentTarget);
				}}
			>
				<MoreVertIcon fontSize='small' />
			</IconButton>
			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={close}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				onClick={(event) => event.stopPropagation()}
			>
				{actions.map((action) => (
					<MenuItem
						key={action.label}
						onClick={() => {
							close();
							action.onClick();
						}}
						sx={{ color: action.color === 'error' ? 'error.main' : 'inherit' }}
					>
						{action.icon}
						{action.label}
					</MenuItem>
				))}
			</Menu>
		</>
	);
}
