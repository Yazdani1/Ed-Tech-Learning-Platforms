import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';
import {
	Box,
	Button,
	TextField,
	Typography,
	CircularProgress,
	Collapse,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { courseService } from '../../../services/course.service';
import SectionCard from './SectionCard';
import type { ICourse, ISection, ILecture } from '../../../types/index';

interface CurriculumBuilderProps {
	courseId: string;
}

export default function CurriculumBuilder({
	courseId,
}: CurriculumBuilderProps) {
	const [sections, setSections] = useState<ISection[]>([]);
	const [loading, setLoading] = useState(true);
	const [addingSection, setAddingSection] = useState(false);
	const [newSectionTitle, setNewSectionTitle] = useState('');

	const fetchCourse = useCallback(async () => {
		const res = await courseService.getById(courseId);
		const course = res.data as ICourse;
		setSections(course.sections ?? []);
		setLoading(false);
	}, [courseId]);

	useEffect(() => {
		if (!courseId) return;
		const load = async () => {
			await fetchCourse();
		};
		void load();
	}, [courseId, fetchCourse]);

	const handleDragEnd = async (result: DropResult) => {
		if (!result.destination) return;
		const { source, destination, type } = result;

		if (type === 'section') {
			const reordered = Array.from(sections);
			const [moved] = reordered.splice(source.index, 1);
			reordered.splice(destination.index, 0, moved);
			setSections(reordered);
			await courseService.reorderSections(
				courseId,
				reordered.map((s) => s._id),
			);
			return;
		}

		if (source.droppableId === destination.droppableId) {
			const sectionId = source.droppableId;
			const updated = sections.map((s) => {
				if (s._id !== sectionId) return s;
				const lectures = Array.from(s.lectures);
				const [moved] = lectures.splice(source.index, 1);
				lectures.splice(destination.index, 0, moved);
				return { ...s, lectures };
			});
			setSections(updated);
			const section = updated.find((s) => s._id === sectionId);
			if (section)
				await courseService.reorderLectures(
					courseId,
					sectionId,
					section.lectures.map((l) => l._id),
				);
		}
	};

	const handleAddSection = async () => {
		if (!newSectionTitle.trim()) return;
		await courseService.addSection(courseId, newSectionTitle.trim());
		setNewSectionTitle('');
		setAddingSection(false);
		void fetchCourse();
	};

	const handleUpdateSection = async (sectionId: string, title: string) => {
		await courseService.updateSection(courseId, sectionId, title);
		setSections((prev) =>
			prev.map((s) => (s._id === sectionId ? { ...s, title } : s)),
		);
	};

	const handleDeleteSection = async (sectionId: string) => {
		await courseService.deleteSection(courseId, sectionId);
		setSections((prev) => prev.filter((s) => s._id !== sectionId));
	};

	const handleAddLecture = async (sectionId: string, title: string) => {
		await courseService.addLecture(courseId, sectionId, { title });
		void fetchCourse();
	};

	const handleUpdateLecture = async (
		sectionId: string,
		lectureId: string,
		data: Partial<ILecture>,
	) => {
		await courseService.updateLecture(courseId, sectionId, lectureId, data);
		setSections((prev) =>
			prev.map((s) => ({
				...s,
				lectures:
					s._id === sectionId
						? s.lectures.map((l) =>
								l._id === lectureId ? { ...l, ...data } : l,
							)
						: s.lectures,
			})),
		);
	};

	const handleDeleteLecture = async (sectionId: string, lectureId: string) => {
		await courseService.deleteLecture(courseId, sectionId, lectureId);
		setSections((prev) =>
			prev.map((s) => ({
				...s,
				lectures:
					s._id === sectionId
						? s.lectures.filter((l) => l._id !== lectureId)
						: s.lectures,
			})),
		);
	};

	if (loading)
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
				<CircularProgress />
			</Box>
		);

	return (
		<Box>
			<Typography variant='h6' sx={{ fontWeight: 600, mb: 2 }}>
				Curriculum
			</Typography>

			<DragDropContext onDragEnd={(result) => void handleDragEnd(result)}>
				<Droppable droppableId='sections' type='section'>
					{(provided) => (
						<Box ref={provided.innerRef} {...provided.droppableProps}>
							{sections.map((section, index) => (
								<SectionCard
									key={section._id}
									section={section}
									index={index}
									courseId={courseId}
									onUpdateSection={handleUpdateSection}
									onDeleteSection={handleDeleteSection}
									onAddLecture={handleAddLecture}
									onUpdateLecture={handleUpdateLecture}
									onDeleteLecture={handleDeleteLecture}
								/>
							))}
							{provided.placeholder}
						</Box>
					)}
				</Droppable>
			</DragDropContext>

			<Collapse in={addingSection}>
				<Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
					<TextField
						value={newSectionTitle}
						onChange={(e) => setNewSectionTitle(e.target.value)}
						size='small'
						placeholder='Section title'
						sx={{ flex: 1 }}
						autoFocus
						onKeyDown={(e) => {
							if (e.key === 'Enter') void handleAddSection();
						}}
					/>
					<Button
						variant='contained'
						size='small'
						onClick={() => void handleAddSection()}
					>
						Add
					</Button>
					<Button size='small' onClick={() => setAddingSection(false)}>
						Cancel
					</Button>
				</Box>
			</Collapse>

			{!addingSection && (
				<Button
					variant='outlined'
					startIcon={<AddIcon />}
					onClick={() => setAddingSection(true)}
					sx={{ mt: 1 }}
				>
					Add Section
				</Button>
			)}
		</Box>
	);
}
