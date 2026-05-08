import { useEffect, useState } from 'react';
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
import type { ICategory, ICourseType, CoursePricing, SubscriptionPlan } from '../../types/index';

const PRICING: CoursePricing[] = ['Free', 'Paid'];

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
	selectedPricing: CoursePricing[];
	onTogglePricing: (pricing: CoursePricing) => void;
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
	selectedPricing,
	onTogglePricing,
	selectedPlans,
	onTogglePlan,
	activeFilterCount,
	onClearAll,
}: Props) {
	const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);

	useEffect(() => {
		subscriptionPlanConfigService
			.getAll()
			.then((res) => setSubscriptionPlans((res.data ?? []).map((plan) => plan.plan)))
			.catch(() => setSubscriptionPlans([]));
	}, []);

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
											label={<Typography variant='body2'>{ct.name}</Typography>}
											sx={{ mr: 0 }}
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
											label={<Typography variant='body2'>{cat.name}</Typography>}
											sx={{ mr: 0 }}
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
									label={<Typography variant='body2'>{pricing}</Typography>}
									sx={{ mr: 0 }}
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
								{subscriptionPlans.map((plan) => (
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
						</Box>
					</Section>
				</Box>
			</Paper>
		</Box>
	);
}
