import dotenv from 'dotenv';
import path from 'path';
import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import '../config/env';
import connectDB from '../config/db';
import { Course } from '../models/Course.model';
import { Subscription } from '../models/Subscription.model';
import { SubscriptionPlanConfig } from '../models/SubscriptionPlanConfig.model';
import { User } from '../models/User.model';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedPlans = [
	{
		plan: 'Starter',
		badge: 'New learners',
		color: '#0284c7',
		features: [
			'Access to beginner courses',
			'Community learning support',
			'Basic quizzes and certificates',
		],
		billingOptions: [
			{ label: 'Monthly', duration: 1, price: 499 },
			{ label: '3 months', duration: 3, price: 1299 },
			{ label: '6 months', duration: 6, price: 2399 },
			{ label: 'Yearly', duration: 12, price: 4499 },
		],
	},
	{
		plan: 'Premium',
		badge: 'Popular',
		color: '#7c3aed',
		features: [
			'Access to most subscription courses',
			'Premium quizzes and assignments',
			'Priority Q&A support',
		],
		billingOptions: [
			{ label: 'Monthly', duration: 1, price: 899 },
			{ label: '3 months', duration: 3, price: 2399 },
			{ label: '6 months', duration: 6, price: 4499 },
			{ label: 'Yearly', duration: 12, price: 7999 },
		],
	},
	{
		plan: 'Quiz Only',
		badge: 'Practice',
		color: '#059669',
		features: [
			'Unlimited quiz practice',
			'Exam preparation sets',
			'Progress tracking',
		],
		billingOptions: [
			{ label: 'Monthly', duration: 1, price: 299 },
			{ label: '3 months', duration: 3, price: 799 },
			{ label: '6 months', duration: 6, price: 1499 },
			{ label: 'Yearly', duration: 12, price: 2499 },
		],
	},
	{
		plan: 'Career Pro',
		badge: 'Best value',
		color: '#d97706',
		features: [
			'Access to every subscription course',
			'Career projects and live support',
			'Advanced certificates',
		],
		billingOptions: [
			{ label: 'Monthly', duration: 1, price: 1499 },
			{ label: '3 months', duration: 3, price: 3999 },
			{ label: '6 months', duration: 6, price: 7499 },
			{ label: 'Yearly', duration: 12, price: 12999 },
		],
	},
];

const sampleSubscriptions = [
	{
		name: 'Monthly Starter Student',
		email: 'sub-monthly-starter@medhabee.local',
		plan: 'Starter',
		duration: 1,
		status: 'Active' as const,
		monthsFromNow: 1,
	},
	{
		name: 'Quarterly Premium Student',
		email: 'sub-quarterly-premium@medhabee.local',
		plan: 'Premium',
		duration: 3,
		status: 'Active' as const,
		monthsFromNow: 3,
	},
	{
		name: 'Six Month Quiz Student',
		email: 'sub-six-month-quiz@medhabee.local',
		plan: 'Quiz Only',
		duration: 6,
		status: 'Active' as const,
		monthsFromNow: 6,
	},
	{
		name: 'Yearly Career Student',
		email: 'sub-yearly-career@medhabee.local',
		plan: 'Career Pro',
		duration: 12,
		status: 'Active' as const,
		monthsFromNow: 12,
	},
	{
		name: 'Expired Premium Student',
		email: 'sub-expired-premium@medhabee.local',
		plan: 'Premium',
		duration: 1,
		status: 'Expired' as const,
		monthsFromNow: -1,
	},
	{
		name: 'Cancelled Career Student',
		email: 'sub-cancelled-career@medhabee.local',
		plan: 'Career Pro',
		duration: 12,
		status: 'Cancelled' as const,
		monthsFromNow: 10,
	},
];

const allowedBillingDurations = new Set([1, 3, 6, 12]);

const addMonths = (date: Date, months: number) => {
	const next = new Date(date);
	next.setMonth(next.getMonth() + months);
	return next;
};

async function ensureAdmin() {
	const admin = await User.findOne({ role: { $in: ['Super Admin', 'Admin'] } });
	if (admin) return admin;

	return User.create({
		name: 'Seed Admin',
		email: 'seed-admin@medhabee.local',
		password: await bcrypt.hash('ChangeMe123!', 10),
		role: 'Super Admin',
		purchasedCourses: [],
	});
}

async function seedPlanConfigs(createdBy: Types.ObjectId) {
	for (const plan of seedPlans) {
		const primaryOption = plan.billingOptions[0];
		await SubscriptionPlanConfig.findOneAndUpdate(
			{ plan: plan.plan },
			{
				...plan,
				price: primaryOption.price,
				duration: primaryOption.duration,
				isActive: true,
				createdBy,
			},
			{ upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
		);
	}
}

async function removeUnsupportedBillingDurations() {
	const configs = await SubscriptionPlanConfig.find();
	let cleanedCount = 0;
	let deactivatedCount = 0;

	for (const config of configs) {
		const supportedOptions = (config.billingOptions ?? []).filter((option) =>
			allowedBillingDurations.has(option.duration),
		);
		const changed = supportedOptions.length !== (config.billingOptions ?? []).length;

		if (supportedOptions.length === 0) {
			config.isActive = false;
			deactivatedCount += 1;
		} else {
			const primaryOption = supportedOptions[0];
			config.billingOptions = supportedOptions;
			config.duration = primaryOption.duration;
			config.price = primaryOption.price;
			if (changed) cleanedCount += 1;
		}

		if (changed || supportedOptions.length === 0) {
			await config.save();
		}
	}

	return { cleanedCount, deactivatedCount };
}

async function seedCoursePlanAssignments() {
	const courses = await Course.find({ status: 'Published' }).sort({ createdAt: 1 }).limit(8);
	const planSets = [
		['Starter', 'Premium', 'Career Pro'],
		['Premium', 'Career Pro'],
		['Quiz Only'],
		['Career Pro'],
	];

	for (let index = 0; index < courses.length; index += 1) {
		const course = courses[index];
		course.includedInSubscription = true;
		course.allowedSubscriptionPlans = planSets[index % planSets.length];
		await course.save();
	}

	return courses.length;
}

async function seedSampleSubscriptions(assignedBy: Types.ObjectId) {
	const now = new Date();

	for (const sample of sampleSubscriptions) {
		const planConfig = seedPlans.find((plan) => plan.plan === sample.plan);
		const billingOption = planConfig?.billingOptions.find((option) => option.duration === sample.duration);
		if (!billingOption) continue;

		const student = await User.findOneAndUpdate(
			{ email: sample.email },
			{
				name: sample.name,
				email: sample.email,
				password: await bcrypt.hash('Student123!', 10),
				role: 'Student',
				purchasedCourses: [],
			},
			{ upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
		);

		await Subscription.deleteMany({ user: student._id });

		const startDate = sample.status === 'Expired' ? addMonths(now, -2) : now;
		const endDate = sample.status === 'Expired' ? addMonths(now, -1) : addMonths(now, sample.monthsFromNow);

		await Subscription.create({
			user: student._id,
			plan: sample.plan,
			billingDuration: billingOption.duration,
			billingLabel: billingOption.label,
			pricePaid: billingOption.price,
			status: sample.status,
			startDate,
			endDate,
			assignedBy,
		});

		if (sample.status === 'Active' && endDate > now) {
			student.activeSubscription = {
				plan: sample.plan,
				billingDuration: billingOption.duration,
				billingLabel: billingOption.label,
				startDate,
				endDate,
			};
		} else {
			student.activeSubscription = undefined;
		}
		await student.save();
	}
}

async function run() {
	await connectDB();
	const admin = await ensureAdmin();
	const adminId = new Types.ObjectId(String(admin._id));

	await seedPlanConfigs(adminId);
	const cleanup = await removeUnsupportedBillingDurations();
	const updatedCourses = await seedCoursePlanAssignments();
	await seedSampleSubscriptions(adminId);

	console.log(`Seeded ${seedPlans.length} subscription plans.`);
	console.log(`Removed unsupported billing durations from ${cleanup.cleanedCount} plan configs.`);
	if (cleanup.deactivatedCount > 0) {
		console.log(`Deactivated ${cleanup.deactivatedCount} plan configs with no supported billing options.`);
	}
	console.log(`Seeded ${sampleSubscriptions.length} sample subscription records.`);
	console.log(`Updated ${updatedCourses} published courses with dynamic plan access.`);
	console.log('Sample student password: Student123!');
}

run()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await mongoose.disconnect();
	});
