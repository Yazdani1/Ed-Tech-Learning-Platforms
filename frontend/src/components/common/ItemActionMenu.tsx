import { type FC, useState } from 'react';
import { IconButton, Menu, MenuItem, Switch } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export interface ItemAction {
	label: string;
	icon?: React.ReactNode;
	color?: 'inherit' | 'error';
	onClick: () => void;
	checked?: boolean;
}

interface ItemActionMenuProps {
	actions: ItemAction[];
}

const ItemActionMenu: FC<ItemActionMenuProps> = ({ actions }) => {
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

	if (actions.length === 0) return null;

	const close = () => setAnchorEl(null);

	return (
		<>
			<IconButton
				size='small'
				aria-label='Open item actions'
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
				slotProps={{
					paper: {
						elevation: 2,
						sx: {
							minWidth: 168,
							borderRadius: 1,
							border: '1px solid',
							borderColor: 'divider',
							mt: 0.5,
						},
					},
					list: {
						sx: { py: 0.75 },
					},
				}}
			>
				{actions.map((action) => (
					<MenuItem
						key={action.label}
						onClick={() => {
							close();
							action.onClick();
						}}
						sx={{
							minHeight: 44,
							px: 1.75,
							gap: 1,
							fontSize: '0.875rem',
							fontWeight: 650,
							color: action.color === 'error' ? 'error.main' : 'inherit',
							'& .MuiSvgIcon-root': { fontSize: 18 },
							...(action.checked !== undefined && { justifyContent: 'space-between' }),
						}}
					>
						<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							{action.icon}
							{action.label}
						</span>
						{action.checked !== undefined && (
							<Switch
								size='small'
								checked={action.checked}
								color='success'
								tabIndex={-1}
								sx={{ pointerEvents: 'none', ml: 1 }}
							/>
						)}
					</MenuItem>
				))}
			</Menu>
		</>
	);
};

export default ItemActionMenu;
