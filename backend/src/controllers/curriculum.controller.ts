import type { Request, Response } from 'express';
import { Course } from '../models/Course.model';
import { Section } from '../models/Section.model';
import { Lecture } from '../models/Lecture.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

// ── Sections ─────────────────────────────────────────────────────────────────

export const addSection = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) throw new AppError('Course not found', 404);

  const { title } = req.body as { title: string };
  if (!title) throw new AppError('Section title is required', 400);

  const order = course.sections.length;
  const section = await Section.create({ course: course._id, title, order });

  course.sections.push(section._id);
  await course.save();

  res.status(201).json({ success: true, message: 'Section added', data: section });
});

export const updateSection = asyncHandler(async (req: Request, res: Response) => {
  const section = await Section.findOne({ _id: req.params.sectionId, course: req.params.courseId });
  if (!section) throw new AppError('Section not found', 404);

  const { title } = req.body as { title: string };
  if (title) section.title = title;

  await section.save();
  res.status(200).json({ success: true, message: 'Section updated', data: section });
});

export const deleteSection = asyncHandler(async (req: Request, res: Response) => {
  const section = await Section.findOne({ _id: req.params.sectionId, course: req.params.courseId });
  if (!section) throw new AppError('Section not found', 404);

  await Lecture.deleteMany({ section: section._id });
  await Course.findByIdAndUpdate(req.params.courseId, { $pull: { sections: section._id } });
  await section.deleteOne();

  res.status(200).json({ success: true, message: 'Section deleted' });
});

export const reorderSections = asyncHandler(async (req: Request, res: Response) => {
  const { orderedIds } = req.body as { orderedIds: string[] };
  if (!Array.isArray(orderedIds)) throw new AppError('orderedIds array is required', 400);

  await Promise.all(
    orderedIds.map((id, index) => Section.findByIdAndUpdate(id, { order: index }))
  );

  await Course.findByIdAndUpdate(req.params.courseId, { sections: orderedIds });
  res.status(200).json({ success: true, message: 'Sections reordered' });
});

// ── Lectures ──────────────────────────────────────────────────────────────────

export const addLecture = asyncHandler(async (req: Request, res: Response) => {
  const section = await Section.findOne({ _id: req.params.sectionId, course: req.params.courseId });
  if (!section) throw new AppError('Section not found', 404);

  const { title, description, videoUrl, isPreview, duration } = req.body as {
    title: string;
    description?: string;
    videoUrl?: string;
    isPreview?: boolean;
    duration?: number;
  };
  if (!title) throw new AppError('Lecture title is required', 400);

  const order = section.lectures.length;
  const lecture = await Lecture.create({ section: section._id, title, description, videoUrl, isPreview, duration, order });

  section.lectures.push(lecture._id);
  await section.save();

  res.status(201).json({ success: true, message: 'Lecture added', data: lecture });
});

export const updateLecture = asyncHandler(async (req: Request, res: Response) => {
  const lecture = await Lecture.findOne({ _id: req.params.lectureId, section: req.params.sectionId });
  if (!lecture) throw new AppError('Lecture not found', 404);

  const { title, description, videoUrl, isPreview, duration } = req.body as {
    title?: string;
    description?: string;
    videoUrl?: string;
    isPreview?: boolean;
    duration?: number;
  };

  if (title !== undefined) lecture.title = title;
  if (description !== undefined) lecture.description = description;
  if (videoUrl !== undefined) lecture.videoUrl = videoUrl;
  if (isPreview !== undefined) lecture.isPreview = isPreview;
  if (duration !== undefined) lecture.duration = duration;

  await lecture.save();
  res.status(200).json({ success: true, message: 'Lecture updated', data: lecture });
});

export const deleteLecture = asyncHandler(async (req: Request, res: Response) => {
  const lecture = await Lecture.findOne({ _id: req.params.lectureId, section: req.params.sectionId });
  if (!lecture) throw new AppError('Lecture not found', 404);

  await Section.findByIdAndUpdate(req.params.sectionId, { $pull: { lectures: lecture._id } });
  await lecture.deleteOne();

  res.status(200).json({ success: true, message: 'Lecture deleted' });
});

export const reorderLectures = asyncHandler(async (req: Request, res: Response) => {
  const { orderedIds } = req.body as { orderedIds: string[] };
  if (!Array.isArray(orderedIds)) throw new AppError('orderedIds array is required', 400);

  await Promise.all(
    orderedIds.map((id, index) => Lecture.findByIdAndUpdate(id, { order: index }))
  );

  await Section.findByIdAndUpdate(req.params.sectionId, { lectures: orderedIds });
  res.status(200).json({ success: true, message: 'Lectures reordered' });
});
