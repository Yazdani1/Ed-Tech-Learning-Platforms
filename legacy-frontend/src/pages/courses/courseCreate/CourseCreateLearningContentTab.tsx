import { type FC } from 'react';
import { Box, Typography } from '@mui/material';
import RichTextEditor from '../../../components/course/RichTextEditor';
import { ArrayFieldEditor } from './CourseCreateBasicInfoTab';

interface CourseCreateLearningContentTabProps {
	description: string;
	whatYouWillLearn: string[];
	whatYouWillGet: string[];
	requirements: string[];
	onSet: (field: string, value: unknown) => void;
}

const CourseCreateLearningContentTab: FC<CourseCreateLearningContentTabProps> =
	({ description, whatYouWillLearn, whatYouWillGet, requirements, onSet }) => {
		return (
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					gap: 4,
					maxWidth: 720,
				}}
			>
				<Box>
					<Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
						Description
					</Typography>
					<RichTextEditor
						value={description}
						onChange={(html) => onSet('description', html)}
						placeholder='Describe what this course is about...'
						minHeight={200}
					/>
				</Box>
				<ArrayFieldEditor
					label='What students will learn'
					values={whatYouWillLearn}
					onChange={(v) => onSet('whatYouWillLearn', v)}
				/>
				<ArrayFieldEditor
					label='What students will get'
					values={whatYouWillGet}
					onChange={(v) => onSet('whatYouWillGet', v)}
				/>
				<ArrayFieldEditor
					label='Requirements'
					values={requirements}
					onChange={(v) => onSet('requirements', v)}
				/>
			</Box>
		);
	};

export default CourseCreateLearningContentTab;
