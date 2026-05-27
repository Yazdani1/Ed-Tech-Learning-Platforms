import bcrypt from 'bcryptjs';
import mongoose, { type Types } from 'mongoose';
import { config } from '../config/env';
import { CommunityPost } from '../models/CommunityPost.model';
import { CommunityReply } from '../models/CommunityReply.model';
import { User, type IUser } from '../models/User.model';

const DEMO_PASSWORD = 'DemoStudent123!';
const MIN_STUDENTS = 24;
const reactionTypes = ['Like', 'Love', 'Wow', 'Sad', 'Angry', 'Helpful'] as const;

const studentNames = [
  'Aarif Rahman',
  'Nusrat Jahan',
  'Tanvir Hasan',
  'Sadia Akter',
  'Mahmudul Karim',
  'Farhana Islam',
  'Rakib Hossain',
  'Tasmia Noor',
  'Imran Chowdhury',
  'Maliha Sultana',
  'Shihab Uddin',
  'Nabila Ahmed',
  'Fahim Rahman',
  'Sumaiya Khan',
  'Rafi Ahmed',
  'Mim Islam',
  'Arman Hossain',
  'Nadia Rahman',
  'Sakib Mahmud',
  'Jannatul Ferdous',
  'Hasibul Alam',
  'Tania Akter',
  'Rashed Mia',
  'Lamia Chowdhury',
];

const replyTemplates = [
  '<p>I would break this into a smaller action step and try it for one focused study session.</p>',
  '<p>The best answer depends on your current level, but building a tiny example usually clears the confusion.</p>',
  '<p>I had a similar issue before. Writing the idea in my own words helped me find the missing part.</p>',
  '<p>Try comparing two approaches side by side. The tradeoff becomes much easier to understand.</p>',
  '<p>A practical example would help here: start with the simplest version, then add one feature at a time.</p>',
  '<p>For me, the mistake was trying to memorize instead of practicing with real data and real errors.</p>',
  '<p>This is a good question. I would also check the official docs after watching any tutorial.</p>',
  '<p>If you are preparing for exams, make a short checklist from this and revise it every two days.</p>',
  '<p>One thing that works well is explaining the topic to another student. Gaps become obvious quickly.</p>',
  '<p>I suggest saving this as a note and adding links or code snippets whenever you learn something new.</p>',
  '<p>The cleanest path is usually to finish one complete workflow before adding more complexity.</p>',
  '<p>When debugging this, read the error message slowly and verify the data shape before changing code.</p>',
  '<p>You can solve this by creating a small test case and checking each assumption separately.</p>',
  '<p>I agree with the earlier points. Consistency matters more than long study sessions.</p>',
  '<p>In an interview, explain why you chose the solution, not only what the final answer is.</p>',
  '<p>Use diagrams if the topic has relationships, flow, or state changes. It makes the idea easier to remember.</p>',
  '<p>My recommendation is to keep the first version simple and improve it after real feedback.</p>',
  '<p>This answer would be stronger with a short code example or a step-by-step checklist.</p>',
  '<p>I would focus on fundamentals first, then use tools to speed up the repeated parts.</p>',
  '<p>Keep track of repeated mistakes. That list becomes a very useful revision guide.</p>',
];

const asObjectId = (id: unknown) => id as Types.ObjectId;

const ensureStudents = async () => {
  const existingStudents = await User.find({ role: 'Student' }).sort({ createdAt: 1 });
  if (existingStudents.length >= MIN_STUDENTS) return existingStudents;

  const password = await bcrypt.hash(DEMO_PASSWORD, 12);
  const students: IUser[] = [...existingStudents];

  for (let index = existingStudents.length; index < MIN_STUDENTS; index += 1) {
    const name = studentNames[index % studentNames.length];
    const email = `community.reply.student.${index + 1}@demo.local`;
    const user = await User.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          name,
          email,
          password,
          role: 'Student',
          purchasedCourses: [],
          communityPoints: 0,
        },
      },
      { returnDocument: 'after', upsert: true }
    );
    students.push(user);
  }

  return students;
};

const buildRepliesForPost = (postId: Types.ObjectId, postIndex: number, existingCount: number, targetCount: number, students: IUser[]) => {
  const replies = [];

  for (let replyIndex = existingCount; replyIndex < targetCount; replyIndex += 1) {
    const author = students[(postIndex + replyIndex) % students.length];
    const reactionUsers = students.filter((student) => String(student._id) !== String(author._id)).slice(0, 8);
    const createdAt = new Date(Date.now() - (postIndex * 40 + replyIndex) * 1000 * 60 * 9);

    replies.push({
      post: postId,
      body: replyTemplates[(postIndex + replyIndex) % replyTemplates.length],
      author: author._id,
      images: [],
      reactions: reactionUsers.map((user, userIndex) => ({
        user: asObjectId(user._id),
        type: reactionTypes[(replyIndex + userIndex) % reactionTypes.length],
        createdAt,
      })),
      isAccepted: replyIndex === 0 && postIndex % 3 === 0,
      acceptedAt: replyIndex === 0 && postIndex % 3 === 0 ? createdAt : undefined,
      acceptedPointsAwarded: replyIndex === 0 && postIndex % 3 === 0,
      isArchived: false,
      createdAt,
      updatedAt: createdAt,
    });
  }

  return replies;
};

const run = async () => {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected for community reply seed');

  const [students, posts] = await Promise.all([
    ensureStudents(),
    CommunityPost.find({ isArchived: false }).sort({ createdAt: -1 }),
  ]);

  let insertedCount = 0;

  for (const [postIndex, post] of posts.entries()) {
    const existingCount = await CommunityReply.countDocuments({ post: post._id, isArchived: false });
    const targetCount = 10 + (postIndex % 11);
    if (existingCount >= targetCount) continue;

    const replies = buildRepliesForPost(asObjectId(post._id), postIndex, existingCount, targetCount, students);
    if (replies.length > 0) {
      await CommunityReply.insertMany(replies);
      insertedCount += replies.length;
    }
  }

  console.log(`Community reply seed complete: ${insertedCount} replies added across ${posts.length} active posts.`);
  await mongoose.disconnect();
};

run().catch(async (error: unknown) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
