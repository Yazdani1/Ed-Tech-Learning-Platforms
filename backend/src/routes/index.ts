import { Router } from 'express';
import healthRouter from './health.routes';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import teacherRouter from './teacher.routes';
import categoryRouter from './category.routes';
import courseTypeRouter from './courseType.routes';
import courseRouter from './course.routes';
import announcementRouter from './announcement.routes';
import studyCurriculumRouter from './studyCurriculum.routes';
import studyMaterialRouter from './studyMaterial.routes';
import subscriptionRouter from './subscription.routes';
import subscriptionPlanConfigRouter from './subscriptionPlanConfig.routes';
import enrollmentRouter from './enrollment.routes';
import performanceRouter from './performance.routes';
import qaRouter from './qa.routes';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/teachers', teacherRouter);
router.use('/categories', categoryRouter);
router.use('/course-types', courseTypeRouter);
router.use('/courses', courseRouter);
router.use('/announcements', announcementRouter);
router.use('/study-curricula', studyCurriculumRouter);
router.use('/study-materials', studyMaterialRouter);
router.use('/subscriptions', subscriptionRouter);
router.use('/subscription-plans', subscriptionPlanConfigRouter);
router.use('/enrollments', enrollmentRouter);
router.use('/performance', performanceRouter);
router.use('/qa', qaRouter);

export default router;
