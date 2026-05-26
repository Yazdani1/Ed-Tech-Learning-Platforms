import { type FC, useEffect, useState } from 'react';
import {
	Box,
	Checkbox,
	Chip,
	FormControlLabel,
	FormGroup,
	InputAdornment,
	Paper,
	TextField,
	Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { subscriptionPlanConfigService } from '../../services/subscriptionPlanConfig.service';
import type { ICategory, ICourseType, CoursePricing, ICourseFilterCounts, SubscriptionPlan } from '../../types/index';

const PRICING: CoursePricing[] = ['Free', 'Paid'];
const filterOptionSx = {
	mr: 0,
	width: '100%',
	'& .MuiFormControlLabel-label': {
		flex: 1,
		minWidth: 0,
	},
};

interface SectionProps {
	label: string;
	children: React.ReactNode;
}

const Section: FC<SectionProps> = ({ label, children }) => {
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
};

interface CountLabelProps {
	label: string;
	count?: number;
}

const CountLabel: FC<CountLabelProps> = ({ label, count }) => {
	return (
		<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, width: '100%' }}>
			<Typography variant='body2' sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
				{label}
			</Typography>
			<Typography variant='caption' color='text.secondary' sx={{ flexShrink: 0, fontWeight: 700 }}>
				({count ?? 0})
			</Typography>
		</Box>
	);
};

interface CourseFilterSidebarProps {
	searchInput: string;
	onSearchChange: (value: string) => void;
	courseTypes: ICourseType[];
	selectedCourseTypes: string[];
	onToggleCourseType: (id: string) => void;
	categories: ICategory[];
	selectedCategories: string[];
	onToggleCategory: (id: string) => void;
	selectedPricing: CoursePricing[];
	onTogglePricing: (pricing: CoursePricing) => void;
	selectedPlans: SubscriptionPlan[];
	onTogglePlan: (plan: SubscriptionPlan) => void;
	subscriptionPlanOptions?: SubscriptionPlan[];
	filterCounts?: ICourseFilterCounts;
	activeFilterCount: number;
	onClearAll: () => void;
}

const CourseFilterSidebar: FC<CourseFilterSidebarProps> = ({
	searchInput,
	onSearchChange,
	courseTypes,
	selectedCourseTypes,
	onToggleCourseType,
	categories,
	selectedCategories,
	onToggleCategory,
	selectedPricing,
	onTogglePricing,
	selectedPlans,
	onTogglePlan,
	subscriptionPlanOptions,
	filterCounts,
	activeFilterCount,
	onClearAll,
}) => {
	const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
	const displayedSubscriptionPlans = subscriptionPlanOptions ?? subscriptionPlans;

	useEffect(() => {
		if (subscriptionPlanOptions) return;
		subscriptionPlanConfigService
			.getAll()
			.then((res) => setSubscriptionPlans((res.data ?? []).map((plan) => plan.plan)))
			.catch(() => setSubscriptionPlans([]));
	}, [subscriptionPlanOptions]);

	return (
		<Box>
			{/* The Paper itself scrolls independently — sections stay visible without scrolling the whole page */}
			<Paper
				variant='outlined'
				sx={{
					borderRadius: 0.5,
					overflow: 'hidden',
					maxHeight: 'calc(100vh - 120px)',
					overflowY: 'auto',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				{/* Header */}
				<Box
					sx={{
						px: 2,
						py: 1.25,
						borderBottom: '1px solid',
						borderColor: 'divider',
						flexShrink: 0,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						bgcolor: 'grey.50',
					}}
				>
					<Typography variant='subtitle2' sx={{ fontWeight: 700 }}>Filters</Typography>
					{activeFilterCount > 0 && (
						<Chip
							label={`${activeFilterCount} active`}
							size='small'
							color='primary'
							onDelete={onClearAll}
							sx={{ fontWeight: 700, fontSize: '0.7rem' }}
						/>
					)}
				</Box>

				{/* Search — pinned, never scrolls away */}
				<Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
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
					<Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
						<Section label='Course Type'>
							<Box sx={{ maxHeight: 200, overflowY: 'auto', pr: 0.5 }}>
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
											label={<CountLabel label={ct.name} count={filterCounts?.courseTypes[ct._id]} />}
											sx={filterOptionSx}
										/>
									))}
								</FormGroup>
							</Box>
						</Section>
					</Box>
				)}

				{/* Category */}
				{categories.length > 0 && (
					<Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
						<Section label='Category'>
							<Box sx={{ maxHeight: 200, overflowY: 'auto', pr: 0.5 }}>
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
											label={<CountLabel label={cat.name} count={filterCounts?.categories[cat._id]} />}
											sx={filterOptionSx}
										/>
									))}
								</FormGroup>
							</Box>
						</Section>
					</Box>
				)}

				{/* Pricing */}
				<Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
					<Section label='Pricing'>
						<FormGroup>
							{PRICING.map((pricing) => (
								<FormControlLabel
									key={pricing}
									control={
										<Checkbox
											size='small'
											checked={selectedPricing.includes(pricing)}
											onChange={() => onTogglePricing(pricing)}
										/>
									}
									label={<CountLabel label={pricing} count={filterCounts?.pricing[pricing]} />}
									sx={filterOptionSx}
								/>
							))}
						</FormGroup>
					</Section>
				</Box>

				{/* Subscription */}
				<Box sx={{ p: 2, flexShrink: 0 }}>
					<Section label='Subscription'>
						<Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
							Show courses available under these plans
						</Typography>
						<Box sx={{ maxHeight: 200, overflowY: 'auto', pr: 0.5 }}>
							<FormGroup>
								{displayedSubscriptionPlans.map((plan) => (
									<FormControlLabel
										key={plan}
										control={
											<Checkbox
												size='small'
												checked={selectedPlans.includes(plan)}
												onChange={() => onTogglePlan(plan)}
											/>
										}
										label={<CountLabel label={plan} count={filterCounts?.subscriptionPlans[plan]} />}
										sx={filterOptionSx}
									/>
								))}
							</FormGroup>
						</Box>
					</Section>
				</Box>
			</Paper>
		</Box>
	);
};

export default CourseFilterSidebar;
