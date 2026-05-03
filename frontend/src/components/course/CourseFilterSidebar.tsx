import {
	Box,
	Checkbox,
	FormControlLabel,
	FormGroup,
	InputAdornment,
	Paper,
	TextField,
	Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { ICategory, ICourseType, SubscriptionPlan } from '../../types/index';

const PLANS: SubscriptionPlan[] = ['Basic', 'Premium', 'Gold', 'Quiz Only'];

function Section({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<Box>
			<Typography
				variant='caption'
				sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.75, color: 'text.secondary', display: 'block', mb: 1 }}
			>
				{label}
			</Typography>
			{children}
		</Box>
	);
}

interface Props {
	searchInput: string;
	onSearchChange: (value: string) => void;
	courseTypes: ICourseType[];
	selectedCourseTypes: string[];
	onToggleCourseType: (id: string) => void;
	categories: ICategory[];
	selectedCategories: string[];
	onToggleCategory: (id: string) => void;
	selectedPlans: SubscriptionPlan[];
	onTogglePlan: (plan: SubscriptionPlan) => void;
	activeFilterCount: number;
	onClearAll: () => void;
}

export default function CourseFilterSidebar({
	searchInput,
	onSearchChange,
	courseTypes,
	selectedCourseTypes,
	onToggleCourseType,
	categories,
	selectedCategories,
	onToggleCategory,
	selectedPlans,
	onTogglePlan,
	activeFilterCount,
	onClearAll,
}: Props) {
	return (
		<Box>
			<Paper variant='outlined' sx={{ borderRadius: 0.5, overflow: 'hidden' }}>
				{/* Search */}
				<Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
					<Section label='Search'>
						<TextField
							size='small'
							fullWidth
							placeholder='Search courses…'
							value={searchInput}
							onChange={(e) => onSearchChange(e.target.value)}
							slotProps={{
								input: {
									startAdornment: (
										<InputAdornment position='start'>
											<SearchIcon fontSize='small' />
										</InputAdornment>
									),
								},
							}}
						/>
					</Section>
				</Box>

				{/* Course Type */}
				{courseTypes.length > 0 && (
					<Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
						<Section label='Course Type'>
							<FormGroup>
								{courseTypes.map((ct) => (
									<FormControlLabel
										key={ct._id}
										control={
											<Checkbox
												size='small'
												checked={selectedCourseTypes.includes(ct._id)}
												onChange={() => onToggleCourseType(ct._id)}
											/>
										}
										label={<Typography variant='body2'>{ct.name}</Typography>}
										sx={{ mr: 0 }}
									/>
								))}
							</FormGroup>
						</Section>
					</Box>
				)}

				{/* Category */}
				{categories.length > 0 && (
					<Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
						<Section label='Category'>
							<FormGroup>
								{categories.map((cat) => (
									<FormControlLabel
										key={cat._id}
										control={
											<Checkbox
												size='small'
												checked={selectedCategories.includes(cat._id)}
												onChange={() => onToggleCategory(cat._id)}
											/>
										}
										label={<Typography variant='body2'>{cat.name}</Typography>}
										sx={{ mr: 0 }}
									/>
								))}
							</FormGroup>
						</Section>
					</Box>
				)}

				{/* Subscription */}
				<Box sx={{ p: 2 }}>
					<Section label='Subscription'>
						<Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
							Show courses available under these plans
						</Typography>
						<FormGroup>
							{PLANS.map((plan) => (
								<FormControlLabel
									key={plan}
									control={
										<Checkbox
											size='small'
											checked={selectedPlans.includes(plan)}
											onChange={() => onTogglePlan(plan)}
										/>
									}
									label={<Typography variant='body2'>{plan}</Typography>}
									sx={{ mr: 0 }}
								/>
							))}
						</FormGroup>
					</Section>
				</Box>
			</Paper>

			{activeFilterCount > 0 && (
				<Box onClick={onClearAll} sx={{ mt: 1.5, textAlign: 'center', cursor: 'pointer' }}>
					<Typography
						variant='caption'
						color='primary'
						sx={{ fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
					>
						Clear all filters
					</Typography>
				</Box>
			)}
		</Box>
	);
}
