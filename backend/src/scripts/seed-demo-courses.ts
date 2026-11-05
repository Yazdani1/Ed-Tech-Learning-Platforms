// Dev/demo data: 20 published courses (6 categories, 3 course types, 5 teachers, sections and lectures).
// Adds only what is missing (safe to run again); never deletes anything; refuses to run in production.
//   npm --prefix backend run seed:demo-courses        (or, with the Docker dev stack running:)
//   docker exec edtech-learning-platform-backend-1 npm run seed:demo-courses
import mongoose, { type Types } from 'mongoose';
import { config } from '../config/env';
import { Category } from '../models/Category.model';
import { CourseType } from '../models/CourseType.model';
import { Course } from '../models/Course.model';
import { Lecture } from '../models/Lecture.model';
import { Section } from '../models/Section.model';
import { Teacher } from '../models/Teacher.model';
import { User } from '../models/User.model';

const CATEGORIES = [
  { name: 'Programming', slug: 'demo-programming' },
  { name: 'Web Development', slug: 'demo-web-development' },
  { name: 'Data Science', slug: 'demo-data-science' },
  { name: 'Design', slug: 'demo-design' },
  { name: 'Business', slug: 'demo-business' },
  { name: 'Languages', slug: 'demo-languages' },
];

const COURSE_TYPES = [
  { name: 'Recorded Course', slug: 'demo-recorded-course' },
  { name: 'Live Course', slug: 'demo-live-course' },
  { name: 'Bootcamp', slug: 'demo-bootcamp' },
];

const TEACHERS = [
  { name: 'Ayesha Rahman', bio: 'Software engineer and teacher with 10 years of experience.', expertise: ['JavaScript', 'React'] },
  { name: 'Tanvir Hasan', bio: 'Data scientist who loves turning numbers into stories.', expertise: ['Python', 'Machine Learning'] },
  { name: 'Nusrat Jahan', bio: 'Product designer focused on simple, friendly interfaces.', expertise: ['UI Design', 'Figma'] },
  { name: 'Imran Chowdhury', bio: 'Entrepreneur and marketing coach for small businesses.', expertise: ['Marketing', 'Business'] },
  { name: 'Farhana Akter', bio: 'Language teacher helping students speak with confidence.', expertise: ['English', 'IELTS'] },
];

// [title, category index, course type index, teacher index, list price (0 = free), discount price]
const COURSES: [string, number, number, number, number, number][] = [
  ['JavaScript for Absolute Beginners', 0, 0, 0, 0, 0],
  ['Modern JavaScript: ES6 and Beyond', 0, 0, 0, 1500, 1200],
  ['Python Programming Fundamentals', 0, 0, 1, 0, 0],
  ['Object-Oriented Programming in Java', 0, 1, 0, 2000, 2000],
  ['HTML and CSS: Build Your First Website', 1, 0, 0, 0, 0],
  ['React from Zero to Hero', 1, 2, 0, 3500, 2800],
  ['Next.js Full-Stack Web Apps', 1, 1, 0, 4000, 4000],
  ['Node.js and Express REST APIs', 1, 0, 0, 2500, 1999],
  ['Data Analysis with Pandas', 2, 0, 1, 1800, 1800],
  ['Machine Learning Basics', 2, 2, 1, 5000, 3999],
  ['SQL for Data Analysts', 2, 0, 1, 0, 0],
  ['Statistics Made Simple', 2, 1, 1, 1200, 999],
  ['UI Design with Figma', 3, 0, 2, 1500, 1500],
  ['UX Research Essentials', 3, 1, 2, 0, 0],
  ['Graphic Design Principles', 3, 0, 2, 1000, 750],
  ['Digital Marketing Fundamentals', 4, 0, 3, 0, 0],
  ['Starting Your Online Business', 4, 1, 3, 2200, 2200],
  ['Personal Finance for Students', 4, 0, 3, 800, 600],
  ['Spoken English for Everyday Life', 5, 1, 4, 0, 0],
  ['IELTS Preparation Course', 5, 2, 4, 3000, 2500],
];

const SECTIONS = ['Getting Started', 'Core Concepts', 'Practice Project'];
const LECTURES_PER_SECTION = 3;
const LECTURE_SECONDS = 600;
// Public, embeddable YouTube video used for the free preview lectures
const PREVIEW_VIDEO = 'https://www.youtube.com/watch?v=rfscVS0vtbw';

const slugToId = async <Item extends { slug: string }>(
  upsert: (item: Item) => Promise<{ _id: unknown }>,
  items: Item[],
): Promise<Types.ObjectId[]> => {
  const ids: Types.ObjectId[] = [];
  for (const item of items) {
    const doc = await upsert(item);
    ids.push(doc._id as Types.ObjectId);
  }
  return ids;
};

const upsertOptions = { upsert: true, returnDocument: 'after' } as const;

const ensureTeachers = async (): Promise<Types.ObjectId[]> => {
  const ids: Types.ObjectId[] = [];
  for (const teacher of TEACHERS) {
    const doc = await Teacher.findOneAndUpdate({ name: teacher.name }, { $setOnInsert: teacher }, { upsert: true, returnDocument: 'after' });
    ids.push(doc._id as Types.ObjectId);
  }
  return ids;
};

const addCurriculum = async (courseId: Types.ObjectId, title: string): Promise<Types.ObjectId[]> => {
  const sectionIds: Types.ObjectId[] = [];
  for (const [sectionIndex, sectionTitle] of SECTIONS.entries()) {
    const section = await Section.create({ course: courseId, title: sectionTitle, order: sectionIndex });
    const lectures = await Lecture.insertMany(
      Array.from({ length: LECTURES_PER_SECTION }, (_, lectureIndex) => ({
        section: section._id,
        title: `${sectionTitle}: part ${lectureIndex + 1}`,
        description: `Lesson ${lectureIndex + 1} of "${sectionTitle}" in ${title}.`,
        duration: LECTURE_SECONDS,
        order: lectureIndex,
        isPreview: sectionIndex === 0 && lectureIndex === 0,
        videoUrl: PREVIEW_VIDEO,
      })),
    );
    section.lectures = lectures.map((lecture) => lecture._id as Types.ObjectId);
    await section.save();
    sectionIds.push(section._id as Types.ObjectId);
  }
  return sectionIds;
};

async function seedDemoCourses(): Promise<void> {
  if (config.nodeEnv === 'production') throw new Error('Demo data must never be added to production');
  await mongoose.connect(config.mongoUri);

  const admin = await User.findOne({ role: 'Super Admin' });
  if (!admin) throw new Error('Create the Super Admin first (seed-admin.ts with SEED_ADMIN_PASSWORD)');

  const categoryIds = await slugToId(
    (item) => Category.findOneAndUpdate({ slug: item.slug }, { $setOnInsert: item }, upsertOptions).orFail(),
    CATEGORIES,
  );
  const courseTypeIds = await slugToId(
    (item) => CourseType.findOneAndUpdate({ slug: item.slug }, { $setOnInsert: item }, upsertOptions).orFail(),
    COURSE_TYPES,
  );
  const teacherIds = await ensureTeachers();

  let created = 0;
  for (const [title, category, courseType, teacher, listPrice, discountPrice] of COURSES) {
    if (await Course.exists({ title })) continue;
    const paid = listPrice > 0;
    const course = await Course.create({
      title,
      subtitle: `A practical, step-by-step course: ${title.toLowerCase()}.`,
      description: `<p>${title} takes you from the basics to real projects with short videos, exercises and a final project.</p>`,
      category: categoryIds[category],
      courseType: courseTypeIds[courseType],
      teachers: [teacherIds[teacher]],
      visibility: 'Public',
      status: 'Published',
      publishedAt: new Date(),
      pricing: paid ? 'Paid' : 'Free',
      listPrice: paid ? listPrice : 0,
      discountPrice: paid ? discountPrice : 0,
      price: paid ? discountPrice : 0,
      whatYouWillLearn: ['The key ideas, explained simply', 'Hands-on exercises', 'A finished project for your portfolio'],
      whatYouWillGet: ['Lifetime access', 'Certificate of completion'],
      requirements: ['A computer with internet access', 'No prior experience needed'],
      createdBy: admin._id,
    });
    course.sections = await addCurriculum(course._id as Types.ObjectId, title);
    await course.save();
    created += 1;
  }

  console.log(`Demo courses: ${created} added, ${COURSES.length - created} already there.`);
  await mongoose.disconnect();
}

seedDemoCourses().catch(async (error) => {
  console.error('Demo seed failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
