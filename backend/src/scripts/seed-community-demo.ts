import bcrypt from 'bcryptjs';
import mongoose, { type Types } from 'mongoose';
import { config } from '../config/env';
import { CommunityChannel } from '../models/CommunityChannel.model';
import { CommunityPost, type CommunityReactionType } from '../models/CommunityPost.model';
import { CommunityReply } from '../models/CommunityReply.model';
import { User, type IUser } from '../models/User.model';

const DEMO_PASSWORD = 'DemoStudent123!';
const POST_PREFIX = '[Demo Community]';
const reactionTypes: CommunityReactionType[] = ['Like', 'Love', 'Wow', 'Sad', 'Angry', 'Helpful'];

const demoChannels = [
  {
    name: 'AI Study Circle',
    slug: 'ai-study-circle',
    description: '<p>Discuss AI tools, prompts, machine learning basics, and study workflows.</p>',
  },
  {
    name: 'Career & Interview Prep',
    slug: 'career-interview-prep',
    description: '<p>Share interview questions, portfolio reviews, job prep, and career advice.</p>',
  },
];

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

const topics = [
  'How do you stay consistent while learning JavaScript every day?',
  'Best resources for understanding async and promises',
  'How should I prepare for my first frontend interview?',
  'What is the cleanest way to structure React components?',
  'Tips for solving programming problems faster',
  'How do you take notes while watching course lectures?',
  'Which projects should a beginner add to a portfolio?',
  'How to understand MongoDB relationships in real apps?',
  'What is your workflow for debugging TypeScript errors?',
  'How can AI tools help without hurting learning?',
  'Best strategy to revise before an exam week',
  'How do you balance course videos and hands-on practice?',
  'What should I learn after HTML, CSS, and JavaScript?',
  'How to explain REST API concepts in an interview?',
  'What are common mistakes in React state management?',
  'How do you improve Git and GitHub confidence?',
  'Which backend topics are most important for MERN jobs?',
  'How to build confidence for live coding interviews?',
  'What makes a discussion answer genuinely helpful?',
  'How do you avoid tutorial fatigue?',
  'Best way to practice database schema design',
  'How to write better project README files',
  'What is the difference between learning and memorizing code?',
  'How can students collaborate on open source?',
  'What are your favorite browser dev tools tricks?',
  'How to plan a full-stack project from scratch?',
  'What should be included in a student dashboard?',
  'How to learn authentication securely?',
  'What are good habits for writing clean commits?',
  'How do you choose between CSS, MUI, and Tailwind?',
  'What does a strong junior developer resume show?',
  'How to prepare for system design as a beginner?',
  'How do you handle burnout during intense study?',
  'What are useful VS Code extensions for students?',
  'How to learn deployment without getting overwhelmed?',
  'What is your approach to reading documentation?',
  'How do you practice speaking technical English?',
  'What is the fastest way to understand React Router?',
  'How do you decide when a feature is finished?',
  'What should moderators look for in helpful replies?',
];

const replyTemplates = [
  '<p>I would start by breaking it into a smaller daily task and tracking progress for a week.</p>',
  '<p>The biggest improvement for me came from building tiny examples instead of only watching videos.</p>',
  '<p>Try writing the concept in your own words. If you cannot explain it simply, revisit the basics.</p>',
  '<p>A small project with real constraints usually teaches more than a long checklist.</p>',
  '<p>I agree with this. Also keep notes of mistakes because those become great revision material.</p>',
  '<p>One practical tip is to read the error slowly from top to bottom before changing code.</p>',
  '<p>For interview prep, practice explaining why you chose a solution, not only the final answer.</p>',
  '<p>Documentation examples are often enough if you recreate them and then modify one thing.</p>',
  '<p>Pairing with another learner can help because you notice gaps while explaining your thought process.</p>',
  '<p>Make sure your portfolio project has a clear user story and a clean README.</p>',
  '<p>I usually save hard questions and return after sleeping on them. The second pass is often easier.</p>',
  '<p>This is a good topic. I think consistency matters more than long study sessions.</p>',
  '<p>Use diagrams when the concept has relationships, flows, or moving parts.</p>',
  '<p>For MERN projects, keep API response shapes consistent. It saves a lot of frontend confusion.</p>',
  '<p>My suggestion is to build one feature end to end before adding more complexity.</p>',
  '<p>Ask yourself what a real user needs to do next. That usually clarifies the implementation.</p>',
  '<p>Accepted answers should include steps, tradeoffs, and a short example when possible.</p>',
  '<p>I had the same problem. Practicing with smaller focused exercises helped a lot.</p>',
  '<p>Keep your code readable first, then optimize only when you see an actual bottleneck.</p>',
  '<p>It helps to turn repeated mistakes into a checklist before submitting work.</p>',
];

const asObjectId = (id: unknown) => id as Types.ObjectId;

const ensureStudents = async () => {
  const password = await bcrypt.hash(DEMO_PASSWORD, 12);
  const users: IUser[] = [];

  for (const [index, name] of studentNames.entries()) {
    const email = `community.student.${index + 1}@demo.local`;
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
    users.push(user);
  }

  return users;
};

const ensureChannels = async (creatorId: Types.ObjectId) => {
  for (const channel of demoChannels) {
    await CommunityChannel.findOneAndUpdate(
      { slug: channel.slug },
      {
        $setOnInsert: {
          ...channel,
          createdBy: creatorId,
          isArchived: false,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  return CommunityChannel.find({ isArchived: false }).sort({ name: 1 });
};

const buildPostBody = (topic: string, channelName: string, index: number) => `
  <p>I am opening this discussion for students working on <strong>${channelName}</strong>.</p>
  <p>${topic}</p>
  <ul>
    <li>Share your practical experience.</li>
    <li>Add examples, resources, or mistakes to avoid.</li>
    <li>Keep replies useful for future students.</li>
  </ul>
  <p>Discussion seed #${index + 1}</p>
`;

const ensurePosts = async (students: IUser[], channels: Awaited<ReturnType<typeof ensureChannels>>) => {
  const posts = [];

  for (let index = 0; index < topics.length; index += 1) {
    const channel = channels[index % channels.length];
    const author = students[index % students.length];
    const title = `${POST_PREFIX} ${topics[index]}`;
    const createdAt = new Date(Date.now() - index * 1000 * 60 * 60 * 6);

    const post = await CommunityPost.findOneAndUpdate(
      { title },
      {
        $setOnInsert: {
          channel: channel._id,
          title,
          description: buildPostBody(topics[index], channel.name, index),
          author: author._id,
          reactions: [],
          isPinned: index < 3,
          pinnedBy: index < 3 ? author._id : undefined,
          pinnedAt: index < 3 ? createdAt : undefined,
          isArchived: false,
          createdAt,
          updatedAt: createdAt,
        },
      },
      { returnDocument: 'after', upsert: true, timestamps: false }
    );
    posts.push(post);
  }

  return posts;
};

const ensurePostReactions = async (posts: Awaited<ReturnType<typeof ensurePosts>>, students: IUser[]) => {
  for (const [postIndex, post] of posts.entries()) {
    const reactionUsers = students.slice(0, 20);
    post.reactions = reactionUsers.map((user, userIndex) => ({
      user: asObjectId(user._id),
      type: reactionTypes[(postIndex + userIndex) % reactionTypes.length],
      createdAt: new Date(Date.now() - userIndex * 1000 * 60 * 3),
    }));
    await post.save();
  }
};

const ensureReplies = async (posts: Awaited<ReturnType<typeof ensurePosts>>, students: IUser[]) => {
  for (const [postIndex, post] of posts.entries()) {
    const existingCount = await CommunityReply.countDocuments({ post: post._id });
    const targetCount = 10 + (postIndex % 11);

    if (existingCount >= targetCount) continue;

    const repliesToCreate = [];
    for (let replyIndex = existingCount; replyIndex < targetCount; replyIndex += 1) {
      const author = students[(postIndex + replyIndex + 3) % students.length];
      const createdAt = new Date(Date.now() - (postIndex * 30 + replyIndex) * 1000 * 60 * 11);
      repliesToCreate.push({
        post: post._id,
        body: replyTemplates[(postIndex + replyIndex) % replyTemplates.length],
        author: author._id,
        reactions: students.slice(0, 6).map((user, userIndex) => ({
          user: asObjectId(user._id),
          type: reactionTypes[(replyIndex + userIndex) % reactionTypes.length],
          createdAt,
        })),
        isAccepted: replyIndex === 0 || (replyIndex === 3 && postIndex % 4 === 0),
        acceptedAt: replyIndex === 0 ? createdAt : undefined,
        acceptedPointsAwarded: replyIndex === 0,
        createdAt,
        updatedAt: createdAt,
      });
    }

    await CommunityReply.insertMany(repliesToCreate);
  }
};

const run = async () => {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected for community demo seed');

  const students = await ensureStudents();
  const channels = await ensureChannels(asObjectId(students[0]._id));
  const posts = await ensurePosts(students, channels);
  await ensurePostReactions(posts, students);
  await ensureReplies(posts, students);

  const replyCount = await CommunityReply.countDocuments({ post: { $in: posts.map((post) => post._id) } });
  console.log(`Community demo seed complete: ${channels.length} active channels, ${posts.length} demo posts, ${replyCount} replies.`);

  await mongoose.disconnect();
};

run().catch(async (error: unknown) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
