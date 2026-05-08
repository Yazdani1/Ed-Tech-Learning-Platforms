import dotenv from 'dotenv';
import path from 'path';
import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import '../config/env';
import connectDB from '../config/db';
import { Category } from '../models/Category.model';
import { Course } from '../models/Course.model';
import { CourseType } from '../models/CourseType.model';
import { Teacher } from '../models/Teacher.model';
import { User } from '../models/User.model';
import type { SubscriptionPlan } from '../types/index';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const TOTAL_COURSES = 50;
const DEFAULT_CAMPAIGN_DAYS = 7;

const courseTitles = [
	'JavaScript Mastery Bootcamp',
	'React Frontend Engineering',
	'Node.js Backend Development',
	'MongoDB for Real Projects',
	'TypeScript Professional Course',
	'Python Programming Foundations',
	'Django Web Development',
	'Machine Learning Essentials',
	'Data Analysis with Python',
	'Generative AI Prompt Engineering',
	'Full Stack MERN Projects',
	'Next.js Production Apps',
	'UI UX Design Systems',
	'Figma to Frontend Workflow',
	'Flutter Mobile App Development',
	'React Native Complete Guide',
	'DevOps CI CD Pipelines',
	'AWS Cloud Practitioner',
	'Docker and Kubernetes Basics',
	'Cybersecurity Fundamentals',
	'Ethical Hacking Starter Kit',
	'SQL and Database Design',
	'Advanced CSS and Animation',
	'Tailwind CSS for Developers',
	'Git and GitHub Workflow',
	'REST API Design',
	'GraphQL API Development',
	'Testing JavaScript Apps',
	'Clean Code for Developers',
	'Software Architecture Basics',
	'Laravel Web Development',
	'PHP Professional Course',
	'Java Spring Boot Essentials',
	'C Sharp and .NET Core',
	'Android App Development',
	'iOS Swift Fundamentals',
	'Game Development with Unity',
	'Web Performance Optimization',
	'Product Management for Tech',
	'Digital Marketing Analytics',
	'SEO for Modern Websites',
	'WordPress Theme Development',
	'No Code Automation',
	'Excel to Data Dashboard',
	'Power BI Business Reports',
	'Blockchain Development Basics',
	'Computer Networking Essentials',
	'Linux Server Administration',
	'QA Automation with Playwright',
	'Career Ready Developer Portfolio',
];

const discountPercents = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const coverImages = [
	'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
	'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
	'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80',
	'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
	'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
	'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
	'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
	'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
	'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
	'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
];

const money = (value: number) => Math.round(value * 100) / 100;

async function ensureSeedBasics() {
	const [category, courseType, teacher, admin] = await Promise.all([
		Category.findOneAndUpdate(
			{ slug: 'professional-development' },
			{
				$setOnInsert: {
					name: 'Professional Development',
					slug: 'professional-development',
					description: 'Practical professional technology courses',
				},
			},
			{ upsert: true, new: true },
		),
		CourseType.findOneAndUpdate(
			{ slug: 'recorded-course' },
			{
				$setOnInsert: {
					name: 'Recorded Course',
					slug: 'recorded-course',
					description: 'Self-paced recorded lessons',
				},
			},
			{ upsert: true, new: true },
		),
		Teacher.findOneAndUpdate(
			{ name: 'MedhaBee Academy Team' },
			{
				$setOnInsert: {
					name: 'MedhaBee Academy Team',
					bio: 'A practical teaching team focused on career-ready learning.',
					expertise: ['Programming', 'Design', 'Career Skills'],
					profileImage: 'https://placehold.co/240x240?text=Teacher',
				},
			},
			{ upsert: true, new: true },
		),
		User.findOne({ role: { $in: ['Super Admin', 'Admin'] } }),
	]);

	const createdBy =
		admin ??
		(await User.create({
			name: 'Seed Admin',
			email: 'seed-admin@medhabee.local',
			password: await bcrypt.hash('ChangeMe123!', 10),
			role: 'Super Admin',
			purchasedCourses: [],
		}));

	return { category, courseType, teacher, createdBy };
}

function priceForIndex(index: number) {
	const listPrice = 1200 + (index % 10) * 300 + Math.floor(index / 10) * 500;
	const discountPercent = discountPercents[index % discountPercents.length];
	const discountPrice = money(listPrice * (1 - discountPercent / 100));
	const discountAmount = money(listPrice - discountPrice);

	return { listPrice, discountPrice, discountAmount, discountPercent };
}

async function run() {
	await connectDB();
	const { category, courseType, teacher, createdBy } = await ensureSeedBasics();
	const discountEndsAt = new Date(Date.now() + DEFAULT_CAMPAIGN_DAYS * 24 * 60 * 60 * 1000);

	const existingCourses = await Course.find().sort({ createdAt: 1 });
	const targetCount = Math.max(TOTAL_COURSES, existingCourses.length);
	let updatedCount = 0;
	let createdCount = 0;

	for (let index = 0; index < targetCount; index += 1) {
		const existing = existingCourses[index];
		const title = existing?.title || courseTitles[index % courseTitles.length];
		const { listPrice, discountPrice, discountPercent } = priceForIndex(index);
		const commonUpdate = {
			title,
			subtitle: `${discountPercent}% discount available for a limited time`,
			description:
				'Build practical skills through structured lessons, examples, and real-world projects.',
			category: category._id,
			courseType: courseType._id,
			teachers: [teacher._id],
			visibility: 'Public' as const,
			pricing: 'Paid' as const,
			price: discountPrice,
			listPrice,
			discountPrice,
			discountPercent,
			discountEndsAt,
			includedInSubscription: index % 3 === 0,
			allowedSubscriptionPlans: index % 3 === 0 ? (['Premium', 'Gold'] as SubscriptionPlan[]) : [],
			status: 'Published' as const,
			publishedAt: new Date(),
			whatYouWillLearn: [
				'Understand the core concepts clearly',
				'Practice with real project examples',
				'Prepare for job-ready implementation',
			],
			whatYouWillGet: [
				'Lifetime access',
				'Certificate of completion',
				'Project-based learning resources',
			],
			requirements: ['A laptop or desktop computer', 'Basic internet access'],
			coverImage: coverImages[index % coverImages.length],
		};

		if (existing) {
			await Course.updateOne({ _id: existing._id }, { $set: commonUpdate });
			updatedCount += 1;
		} else {
			await Course.create({
				...commonUpdate,
				createdBy: new Types.ObjectId(String(createdBy._id)),
				sections: [],
			});
			createdCount += 1;
		}
	}

	const sample = await Course.find({ pricing: 'Paid' })
		.select('title listPrice discountPrice price')
		.sort({ createdAt: 1 })
		.limit(5)
		.lean();

	console.log(`Discount course seed complete. Updated: ${updatedCount}, created: ${createdCount}, total touched: ${targetCount}`);
	console.table(
		sample.map((course) => ({
			title: course.title,
			listPrice: course.listPrice,
			discountPrice: course.discountPrice,
			discountPercent:
				course.listPrice && course.discountPrice
					? Math.round(((course.listPrice - course.discountPrice) / course.listPrice) * 100)
					: 0,
		})),
	);
}

run()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await mongoose.disconnect();
	});
