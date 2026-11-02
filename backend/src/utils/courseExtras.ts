import { Types } from 'mongoose';
import type {
	ICourseBenefitsSection,
	ICourseFaq,
	ICourseImage,
	ICourseProject,
	ICourseSuccessStory,
	ICourseToolsSection,
} from '../models/Course.model';
import { config } from '../config/env';
import { AppError } from './AppError';

/** Cloudinary folder of the course section images; saved images must come from it. */
export const COURSE_EXTRAS_FOLDER = 'medhabee/course-extras';

const LIMITS = {
	title: 150,
	text: 2000,
	item: 200,
	url: 500,
	listItems: 30,
	faqs: 50,
	projectImages: 10,
} as const;

const PUBLIC_ID_PATTERN = /^[\w/-]+$/;

type Plain = Record<string, unknown>;

const isPlain = (value: unknown): value is Plain =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/** An object from the request: no `$`-keys (operator injection) and only the known fields. */
const asObject = (value: unknown, label: string, fields: readonly string[]): Plain => {
	if (!isPlain(value)) throw new AppError(`${label} must be an object`, 400);
	for (const key of Object.keys(value)) {
		if (key.startsWith('$') || !fields.includes(key)) throw new AppError(`${label} has an unknown field: ${key}`, 400);
	}
	return value;
};

const asList = (value: unknown, label: string, max: number): unknown[] => {
	if (!Array.isArray(value)) throw new AppError(`${label} must be a list`, 400);
	if (value.length > max) throw new AppError(`${label} can have at most ${max} items`, 400);
	return value;
};

const optionalText = (value: unknown, label: string, max: number): string | undefined => {
	if (value === undefined || value === null) return undefined;
	if (typeof value !== 'string') throw new AppError(`${label} must be text`, 400);
	const text = value.trim();
	if (text.length > max) throw new AppError(`${label} must be at most ${max} characters`, 400);
	return text || undefined;
};

const requiredText = (value: unknown, label: string, max: number): string => {
	const text = optionalText(value, label, max);
	if (!text) throw new AppError(`${label} is required`, 400);
	return text;
};

/** An optional http(s) address. */
const optionalUrl = (value: unknown, label: string): string | undefined => {
	const text = optionalText(value, label, LIMITS.url);
	if (!text) return undefined;
	let url: URL;
	try {
		url = new URL(text);
	} catch {
		throw new AppError(`${label} must be a valid link`, 400);
	}
	if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new AppError(`${label} must be an http(s) link`, 400);
	return url.toString();
};

/** An image uploaded through POST /api/courses/:id/images (only our own Cloudinary account and folder). */
const optionalImage = (value: unknown, label: string): ICourseImage | undefined => {
	if (value === undefined || value === null) return undefined;
	const image = asObject(value, label, ['url', 'publicId']);
	const { url, publicId } = image;
	if (
		typeof url !== 'string' ||
		typeof publicId !== 'string' ||
		!PUBLIC_ID_PATTERN.test(publicId) ||
		!publicId.startsWith(`${COURSE_EXTRAS_FOLDER}/`) ||
		!url.startsWith(`https://res.cloudinary.com/${config.cloudinary.cloudName}/`) ||
		!url.includes(publicId)
	)
		throw new AppError(`${label} must be an uploaded image`, 400);
	return { url, publicId };
};

export const parseToolsSection = (value: unknown): ICourseToolsSection => {
	const body = asObject(value, 'toolsSection', ['title', 'description', 'tools']);
	const ids = asList(body.tools ?? [], 'Tools', LIMITS.listItems);
	if (!ids.every((id) => typeof id === 'string' && Types.ObjectId.isValid(id)))
		throw new AppError('Tools must be tool ids', 400);
	return {
		title: optionalText(body.title, 'Tools title', LIMITS.title),
		description: optionalText(body.description, 'Tools description', LIMITS.text),
		tools: [...new Set(ids as string[])].map((id) => new Types.ObjectId(id)),
	};
};

export const parseBenefitsSection = (value: unknown): ICourseBenefitsSection => {
	const body = asObject(value, 'benefitsSection', ['title', 'description', 'items']);
	return {
		title: optionalText(body.title, 'What you get title', LIMITS.title),
		description: optionalText(body.description, 'What you get description', LIMITS.text),
		items: asList(body.items ?? [], 'What you get items', LIMITS.listItems).map((raw) => {
			const item = asObject(raw, 'What you get item', ['title', 'description', 'icon']);
			return {
				title: requiredText(item.title, 'Item title', LIMITS.title),
				description: optionalText(item.description, 'Item description', LIMITS.text),
				icon: optionalImage(item.icon, 'Item logo'),
			};
		}),
	};
};

export const parseProjects = (value: unknown): ICourseProject[] =>
	asList(value, 'Projects', LIMITS.listItems).map((raw) => {
		const project = asObject(raw, 'Project', ['title', 'description', 'images', 'liveDemoUrl', 'videoUrl']);
		const images = asList(project.images ?? [], 'Project screenshots', LIMITS.projectImages);
		return {
			title: requiredText(project.title, 'Project title', LIMITS.title),
			description: optionalText(project.description, 'Project description', LIMITS.text),
			images: images.map((image) => {
				const screenshot = optionalImage(image, 'Project screenshot');
				if (!screenshot) throw new AppError('Project screenshot must be an uploaded image', 400);
				return screenshot;
			}),
			liveDemoUrl: optionalUrl(project.liveDemoUrl, 'Live demo link'),
			videoUrl: optionalUrl(project.videoUrl, 'Video link'),
		};
	});

export const parseAudience = (value: unknown): string[] =>
	asList(value, 'Who this course is for', LIMITS.listItems).map((item) =>
		requiredText(item, 'Who this course is for item', LIMITS.item),
	);

export const parseSuccessStories = (value: unknown): ICourseSuccessStory[] =>
	asList(value, 'Success stories', LIMITS.listItems).map((raw) => {
		const story = asObject(raw, 'Success story', ['title', 'description', 'companyName', 'photo', 'companyLogo']);
		return {
			title: requiredText(story.title, 'Story title', LIMITS.title),
			description: optionalText(story.description, 'Story description', LIMITS.text),
			companyName: optionalText(story.companyName, 'Company name', LIMITS.title),
			photo: optionalImage(story.photo, 'Profile picture'),
			companyLogo: optionalImage(story.companyLogo, 'Company logo'),
		};
	});

export const parseFaqs = (value: unknown): ICourseFaq[] =>
	asList(value, 'FAQ', LIMITS.faqs).map((raw) => {
		const faq = asObject(raw, 'FAQ item', ['question', 'answer']);
		return {
			question: requiredText(faq.question, 'Question', LIMITS.title * 2),
			answer: requiredText(faq.answer, 'Answer', LIMITS.text),
		};
	});

/** Every image public id used by the course sections (to delete the ones a save removed). */
export const extrasImageIds = (course: {
	benefitsSection?: ICourseBenefitsSection;
	projects?: ICourseProject[];
	successStories?: ICourseSuccessStory[];
}): string[] => {
	const images: Array<ICourseImage | undefined> = [
		...(course.benefitsSection?.items ?? []).map((item) => item.icon),
		...(course.projects ?? []).flatMap((project) => project.images),
		...(course.successStories ?? []).flatMap((story) => [story.photo, story.companyLogo]),
	];
	return images.flatMap((image) => (image?.publicId ? [image.publicId] : []));
};
