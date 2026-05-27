import { type FC, useState } from 'react';
import {
	Box,
	TextField,
	Typography,
	MenuItem,
	FormControlLabel,
	Switch,
	Checkbox,
	FormGroup,
	FormLabel,
	Chip,
	IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import type {
	ICategory,
	ICourseType,
	ITeacher,
	SubscriptionPlan,
} from '../../../types/index';

interface ArrayFieldEditorProps {
	label: string;
	values: string[];
	onChange: (v: string[]) => void;
}

export const ArrayFieldEditor: FC<ArrayFieldEditorProps> = ({
	label,
	values,
	onChange,
}) => {
	const [newValue, setNewValue] = useState('');

	const add = () => {
		const trimmed = newValue.trim();
		if (!trimmed) return;
		onChange([...values, trimmed]);
		setNewValue('');
	};

	const updateItem = (index: number, value: string) => {
		onChange(values.map((item, idx) => (idx === index ? value : item)));
	};

	const removeItem = (index: number) => {
		onChange(values.filter((_, idx) => idx !== index));
	};

	return (
		<Box>
			<Typography variant='body2' sx={{ fontWeight: 600, mb: 2 }}>
				{label}
			</Typography>

			<Box
				sx={{
					display: 'flex',
					gap: 1,
					alignItems: 'center',
					mb: 2,
					'&:hover .addButton': { opacity: 1 },
				}}
			>
				<TextField
					size='small'
					value={newValue}
					onChange={(e) => setNewValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							add();
						}
					}}
					placeholder={`Add ${label.toLowerCase()} item...`}
					fullWidth
				/>
				<IconButton
					className='addButton'
					color='primary'
					size='small'
					onClick={add}
					sx={{
						border: '1px solid',
						borderColor: 'divider',
						opacity: 0,
						transition: 'opacity 0.2s ease-in-out',
					}}
				>
					<AddIcon fontSize='small' />
				</IconButton>
			</Box>

			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
				{values.map((value, idx) => (
					<Box
						key={idx}
						sx={{
							display: 'flex',
							gap: 1,
							alignItems: 'center',
							'&:hover .deleteButton': {
								opacity: 1,
							},
						}}
					>
						<TextField
							fullWidth
							size='small'
							value={value}
							onChange={(e) => updateItem(idx, e.target.value)}
							placeholder={`${label} ${idx + 1}`}
						/>
						<IconButton
							className='deleteButton'
							size='small'
							onClick={() => removeItem(idx)}
							sx={{
								opacity: 0,
								transition: 'opacity 0.2s ease-in-out',
							}}
						>
							<CloseIcon fontSize='small' />
						</IconButton>
					</Box>
				))}
			</Box>
		</Box>
	);
};

interface CourseCreateBasicInfoTabProps {
	form: {
		title: string;
		subtitle: string;
		category: string;
		courseType: string;
		startDate: string;
		endDate: string;
		selectedTeachers: string[];
		description: string;
		visibility: string;
		pricing: string;
		price: string;
		listPrice: string;
		discountPrice: string;
		includedInSubscription: boolean;
		allowedSubscriptionPlans: SubscriptionPlan[];
		whatYouWillLearn: string[];
		whatYouWillGet: string[];
		requirements: string[];
	};
	categories: ICategory[];
	courseTypes: ICourseType[];
	teachers: ITeacher[];
	subscriptionPlans: SubscriptionPlan[];
	onSet: (field: string, value: unknown) => void;
}

const CourseCreateBasicInfoTab: FC<CourseCreateBasicInfoTabProps> = ({
	form,
	categories,
	courseTypes,
	teachers,
	subscriptionPlans,
	onSet,
}) => {
	const listPriceValue = Number(form.listPrice);
	const discountPriceValue = Number(form.discountPrice);
	const discountPercent =
		listPriceValue > 0 &&
		discountPriceValue >= 0 &&
		discountPriceValue < listPriceValue
			? Math.round(
					((listPriceValue - discountPriceValue) / listPriceValue) * 100,
				)
			: 0;

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				gap: 3,
				maxWidth: 720,
			}}
		>
			<TextField
				label='Course Title *'
				value={form.title}
				onChange={(e) => onSet('title', e.target.value)}
				fullWidth
			/>
			<TextField
				label='Subtitle'
				value={form.subtitle}
				onChange={(e) => onSet('subtitle', e.target.value)}
				fullWidth
			/>
			<TextField
				label='Category *'
				select
				value={form.category}
				onChange={(e) => onSet('category', e.target.value)}
				fullWidth
			>
				{categories.map((c) => (
					<MenuItem key={c._id} value={c._id}>
						{c.name}
					</MenuItem>
				))}
			</TextField>

			<TextField
				label='Course Type *'
				select
				value={form.courseType}
				onChange={(e) => onSet('courseType', e.target.value)}
				fullWidth
				helperText={
					courseTypes.length === 0
						? 'No course types available. Create one in Course Types first.'
						: undefined
				}
			>
				{courseTypes.map((ct) => (
					<MenuItem key={ct._id} value={ct._id}>
						{ct.name}
					</MenuItem>
				))}
			</TextField>

			<Box sx={{ display: 'flex', gap: 2 }}>
				<TextField
					label='Start Date'
					type='date'
					value={form.startDate}
					onChange={(e) => onSet('startDate', e.target.value)}
					sx={{ flex: 1 }}
					slotProps={{ inputLabel: { shrink: true } }}
					helperText='Optional'
				/>
				<TextField
					label='End Date'
					type='date'
					value={form.endDate}
					onChange={(e) => onSet('endDate', e.target.value)}
					sx={{ flex: 1 }}
					slotProps={{
						inputLabel: { shrink: true },
						htmlInput: { min: form.startDate || undefined },
					}}
					helperText='Optional'
				/>
			</Box>

			<TextField
				label='Teachers'
				select
				value=''
				onChange={(e) => {
					if (!form.selectedTeachers.includes(e.target.value))
						onSet('selectedTeachers', [
							...form.selectedTeachers,
							e.target.value,
						]);
				}}
				fullWidth
				slotProps={{ select: { displayEmpty: true } }}
			>
				<MenuItem value='' disabled>
					Select a teacher to add
				</MenuItem>
				{teachers.map((t) => (
					<MenuItem key={t._id} value={t._id}>
						{t.name}
					</MenuItem>
				))}
			</TextField>
			<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
				{form.selectedTeachers.map((tid) => {
					const t = teachers.find((x) => x._id === tid);
					return t ? (
						<Chip
							key={tid}
							label={t.name}
							size='small'
							onDelete={() =>
								onSet(
									'selectedTeachers',
									form.selectedTeachers.filter((x) => x !== tid),
								)
							}
						/>
					) : null;
				})}
			</Box>

			<Box sx={{ display: 'flex', gap: 2 }}>
				<TextField
					label='Visibility'
					select
					value={form.visibility}
					onChange={(e) => onSet('visibility', e.target.value)}
					sx={{ flex: 1 }}
				>
					<MenuItem value='Public'>Public</MenuItem>
					<MenuItem value='Private'>Private</MenuItem>
				</TextField>
				<TextField
					label='Pricing'
					select
					value={form.pricing}
					onChange={(e) => onSet('pricing', e.target.value)}
					sx={{ flex: 1 }}
				>
					<MenuItem value='Free'>Free</MenuItem>
					<MenuItem value='Paid'>Paid</MenuItem>
				</TextField>
				{form.pricing === 'Paid' && (
					<>
						<TextField
							label='List Price (BDT)'
							type='number'
							value={form.listPrice}
							onChange={(e) => {
								onSet('listPrice', e.target.value);
								if (!form.discountPrice)
									onSet('discountPrice', e.target.value);
							}}
							sx={{ flex: 1 }}
						/>
						<TextField
							label='Discount Price (BDT)'
							type='number'
							value={form.discountPrice}
							onChange={(e) => {
								onSet('discountPrice', e.target.value);
								onSet('price', e.target.value);
							}}
							helperText={
								discountPercent > 0
									? `${discountPercent}% discount`
									: 'Final buying price'
							}
							sx={{ flex: 1 }}
						/>
						{discountPercent > 0 && (
							<Chip
								label={`${discountPercent}% off`}
								color='success'
								sx={{
									alignSelf: 'flex-start',
									mt: 1,
									fontWeight: 900,
									fontSize: '0.82rem',
								}}
							/>
						)}
					</>
				)}
			</Box>

			<Box>
				<FormControlLabel
					control={
						<Switch
							checked={form.includedInSubscription}
							onChange={(e) =>
								onSet('includedInSubscription', e.target.checked)
							}
						/>
					}
					label='Included in Subscription'
				/>
				{form.includedInSubscription && (
					<Box sx={{ mt: 1 }}>
						<FormLabel>Allowed Subscription Plans</FormLabel>
						<FormGroup row>
							{subscriptionPlans.map((plan) => (
								<FormControlLabel
									key={plan}
									control={
										<Checkbox
											checked={form.allowedSubscriptionPlans.includes(plan)}
											onChange={(e) =>
												onSet(
													'allowedSubscriptionPlans',
													e.target.checked
														? [...form.allowedSubscriptionPlans, plan]
														: form.allowedSubscriptionPlans.filter(
																(p) => p !== plan,
															),
												)
											}
										/>
									}
									label={plan}
								/>
							))}
						</FormGroup>
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default CourseCreateBasicInfoTab;
