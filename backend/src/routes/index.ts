import { Router } from 'express';
import healthRouter from './health.routes';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import teacherRouter from './teacher.routes';
import categoryRouter from './category.routes';
import courseRouter from './course.routes';
import announcementRouter from './announcement.routes';
import subscriptionRouter from './subscription.routes';
import subscriptionPlanConfigRouter from './subscriptionPlanConfig.routes';
import enrollmentRouter from './enrollment.routes';
import performanceRouter from './performance.routes';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/teachers', teacherRouter);
router.use('/categories', categoryRouter);
router.use('/courses', courseRouter);
router.use('/announcements', announcementRouter);
router.use('/subscriptions', subscriptionRouter);
router.use('/subscription-plans', subscriptionPlanConfigRouter);
router.use('/enrollments', enrollmentRouter);
router.use('/performance', performanceRouter);

export default router;
