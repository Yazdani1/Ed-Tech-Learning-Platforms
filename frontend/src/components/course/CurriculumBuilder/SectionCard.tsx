import { useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import {
	Box,
	Card,
	CardContent,
	IconButton,
	TextField,
	Typography,
	Button,
	Tooltip,
	Collapse,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import LectureItem from './LectureItem';
import type { ISection, ILecture } from '../../../types/index';

interface SectionCardProps {
	section: ISection;
	index: number;
	courseId: string;
	onUpdateSection: (sectionId: string, title: string) => Promise<void>;
	onDeleteSection: (sectionId: string) => Promise<void>;
	onAddLecture: (sectionId: string, title: string) => Promise<void>;
	onUpdateLecture: (
		sectionId: string,
		lectureId: string,
		data: Partial<ILecture>,
	) => Promise<void>;
	onDeleteLecture: (sectionId: string, lectureId: string) => Promise<void>;
}

export default function SectionCard({
	section,
	index,
	courseId,
	onUpdateSection,
	onDeleteSection,
	onAddLecture,
	onUpdateLecture,
	onDeleteLecture,
}: SectionCardProps) {
	const [editingTitle, setEditingTitle] = useState(false);
	const [title, setTitle] = useState(section.title);
	const [addingLecture, setAddingLecture] = useState(false);
	const [newLectureTitle, setNewLectureTitle] = useState('');

	const handleSaveTitle = async () => {
		if (title.trim()) await onUpdateSection(section._id, title.trim());
		setEditingTitle(false);
	};

	const handleAddLecture = async () => {
		if (!newLectureTitle.trim()) return;
		await onAddLecture(section._id, newLectureTitle.trim());
		setNewLectureTitle('');
		setAddingLecture(false);
	};

	return (
		<Draggable draggableId={section._id} index={index}>
			{(provided, snapshot) => (
				<Card
					ref={provided.innerRef}
					{...provided.draggableProps}
					elevation={0}
					sx={{
						mb: 2,
						border: '1px solid',
						borderColor: snapshot.isDragging ? 'primary.main' : 'divider',
						borderRadius: 2,
					}}
				>
					{/* Section header */}
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							px: 2,
							py: 1.5,
							bgcolor: 'grey.50',
							borderBottom: '1px solid',
							borderColor: 'divider',
							gap: 1,
						}}
					>
						<Box
							{...provided.dragHandleProps}
							sx={{ color: 'text.disabled', display: 'flex', cursor: 'grab' }}
						>
							<DragIndicatorIcon />
						</Box>
						{editingTitle ? (
							<>
								<TextField
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									size='small'
									sx={{ flex: 1 }}
									autoFocus
								/>
								<Tooltip title='Save'>
									<IconButton
										size='small'
										color='primary'
										onClick={() => void handleSaveTitle()}
									>
										<CheckIcon />
									</IconButton>
								</Tooltip>
								<Tooltip title='Cancel'>
									<IconButton
										size='small'
										onClick={() => setEditingTitle(false)}
									>
										<CloseIcon />
									</IconButton>
								</Tooltip>
							</>
						) : (
							<>
								<Typography sx={{ flex: 1, fontWeight: 600 }}>
									{section.title}
								</Typography>
								<Tooltip title='Edit section'>
									<IconButton
										size='small'
										onClick={() => setEditingTitle(true)}
									>
										<EditIcon fontSize='small' />
									</IconButton>
								</Tooltip>
								<Tooltip title='Delete section'>
									<IconButton
										size='small'
										color='error'
										onClick={() => void onDeleteSection(section._id)}
									>
										<DeleteIcon fontSize='small' />
									</IconButton>
								</Tooltip>
							</>
						)}
					</Box>

					{/* Lectures drop zone */}
					<CardContent sx={{ pt: 1.5, pb: '8px !important' }}>
						<Droppable droppableId={section._id} type='lecture'>
							{(dropProvided) => (
								<Box
									ref={dropProvided.innerRef}
									{...dropProvided.droppableProps}
									sx={{ minHeight: 8 }}
								>
									{section.lectures.map((lecture, lIndex) => (
										<LectureItem
											key={lecture._id}
											lecture={lecture}
											index={lIndex}
											courseId={courseId}
											sectionId={section._id}
											onUpdate={(lectureId, data) =>
												onUpdateLecture(section._id, lectureId, data)
											}
											onDelete={(lectureId) =>
												onDeleteLecture(section._id, lectureId)
											}
										/>
									))}
									{dropProvided.placeholder}
								</Box>
							)}
						</Droppable>

						{/* Add lecture */}
						<Collapse in={addingLecture}>
							<Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
								<TextField
									value={newLectureTitle}
									onChange={(e) => setNewLectureTitle(e.target.value)}
									size='small'
									placeholder='Lecture title'
									sx={{ flex: 1 }}
									autoFocus
									onKeyDown={(e) => {
										if (e.key === 'Enter') void handleAddLecture();
									}}
								/>
								<Button
									size='small'
									variant='contained'
									onClick={() => void handleAddLecture()}
								>
									Add
								</Button>
								<Button size='small' onClick={() => setAddingLecture(false)}>
									Cancel
								</Button>
							</Box>
						</Collapse>

						{!addingLecture && (
							<Button
								size='small'
								startIcon={<AddIcon />}
								onClick={() => setAddingLecture(true)}
								sx={{ mt: 1 }}
							>
								Add Lecture
							</Button>
						)}
					</CardContent>
				</Card>
			)}
		</Draggable>
	);
}
