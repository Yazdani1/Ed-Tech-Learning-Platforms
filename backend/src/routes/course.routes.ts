import { Router } from 'express';
import {
	getCourses,
	getCourseById,
	createCourse,
	updateCourse,
	updateCourseStatus,
	deleteCourse,
	bulkUpdateCourses,
} from '../controllers/course.controller';
import {
	addSection,
	updateSection,
	deleteSection,
	reorderSections,
	addLecture,
	updateLecture,
	deleteLecture,
	reorderLectures,
} from '../controllers/curriculum.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();
const adminRoles = ['Super Admin', 'Admin'] as const;

router.get('/', getCourses);
router.patch('/bulk', protect, authorize(...adminRoles), bulkUpdateCourses);
router.get('/:id', getCourseById);

router.post(
	'/',
	protect,
	authorize(...adminRoles),
	upload.single('coverImage'),
	createCourse,
);
router.put(
	'/:id',
	protect,
	authorize(...adminRoles),
	upload.single('coverImage'),
	updateCourse,
);
router.patch(
	'/:id/status',
	protect,
	authorize(...adminRoles),
	updateCourseStatus,
);
router.delete('/:id', protect, authorize(...adminRoles), deleteCourse);

// Curriculum – Sections
router.post(
	'/:courseId/sections',
	protect,
	authorize(...adminRoles),
	addSection,
);
router.put(
	'/:courseId/sections/:sectionId',
	protect,
	authorize(...adminRoles),
	updateSection,
);
router.delete(
	'/:courseId/sections/:sectionId',
	protect,
	authorize(...adminRoles),
	deleteSection,
);
router.put(
	'/:courseId/sections/reorder',
	protect,
	authorize(...adminRoles),
	reorderSections,
);

// Curriculum – Lectures
router.post(
	'/:courseId/sections/:sectionId/lectures',
	protect,
	authorize(...adminRoles),
	addLecture,
);
router.put(
	'/:courseId/sections/:sectionId/lectures/:lectureId',
	protect,
	authorize(...adminRoles),
	updateLecture,
);
router.delete(
	'/:courseId/sections/:sectionId/lectures/:lectureId',
	protect,
	authorize(...adminRoles),
	deleteLecture,
);
router.put(
	'/:courseId/sections/:sectionId/lectures/reorder',
	protect,
	authorize(...adminRoles),
	reorderLectures,
);

export default router;
