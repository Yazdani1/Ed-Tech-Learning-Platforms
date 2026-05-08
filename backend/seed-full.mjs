/**
 * Full production seed — 30 courses, sections, lectures, curriculum,
 * study materials, subscription plans, teacher profile, enrollments.
 * Usage: node seed-full.mjs
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI =
  'mongodb+srv://shaon1132_db_user:YNDAjUcHacKll3dF@cluster0.rkesfzc.mongodb.net/medhabee_db?retryWrites=true&w=majority&appName=Cluster0';

// ── Schemas ────────────────────────────────────────────────────────────────
const ObjectId = mongoose.Schema.Types.ObjectId;

const User = mongoose.model('User', new mongoose.Schema(
  { name: String, email: { type: String, unique: true, lowercase: true }, password: String, role: { type: String, default: 'Student' }, purchasedCourses: [] },
  { timestamps: true }
));
const Category = mongoose.model('Category', new mongoose.Schema(
  { name: String, slug: { type: String, unique: true }, description: String },
  { timestamps: true }
));
const CourseType = mongoose.model('CourseType', new mongoose.Schema(
  { name: String, slug: { type: String, unique: true }, description: String },
  { timestamps: true }
));
const Teacher = mongoose.model('Teacher', new mongoose.Schema(
  { name: String, bio: String, expertise: [String], profileImage: String, socialLinks: Object, userId: { type: ObjectId, ref: 'User', sparse: true } },
  { timestamps: true }
));
const SubscriptionPlanConfig = mongoose.model('SubscriptionPlanConfig', new mongoose.Schema(
  { plan: { type: String, unique: true }, price: Number, duration: { type: Number, default: 1 }, billingOptions: [{ label: String, duration: Number, price: Number }], features: [String], badge: String, color: String, isActive: { type: Boolean, default: true }, createdBy: { type: ObjectId, ref: 'User' } },
  { timestamps: true }
));
const Section = mongoose.model('Section', new mongoose.Schema(
  { course: { type: ObjectId, ref: 'Course', required: true }, title: String, order: { type: Number, default: 0 }, lectures: [{ type: ObjectId, ref: 'Lecture' }] },
  { timestamps: true }
));
const Lecture = mongoose.model('Lecture', new mongoose.Schema(
  { section: { type: ObjectId, ref: 'Section', required: true }, title: String, description: String, videoUrl: String, duration: Number, order: { type: Number, default: 0 }, isPreview: { type: Boolean, default: false } },
  { timestamps: true }
));
const Course = mongoose.model('Course', new mongoose.Schema(
  { title: String, subtitle: String, description: String, category: { type: ObjectId, ref: 'Category' }, courseType: { type: ObjectId, ref: 'CourseType' }, coverImage: String, teachers: [{ type: ObjectId, ref: 'Teacher' }], visibility: { type: String, default: 'Public' }, pricing: { type: String, default: 'Free' }, price: Number, listPrice: Number, includedInSubscription: { type: Boolean, default: false }, allowedSubscriptionPlans: [String], status: { type: String, default: 'Published' }, whatYouWillLearn: [String], requirements: [String], sections: [{ type: ObjectId, ref: 'Section' }], createdBy: { type: ObjectId, ref: 'User' }, publishedAt: Date },
  { timestamps: true }
));
const StudyCurriculum = mongoose.model('StudyCurriculum', new mongoose.Schema(
  { course: { type: ObjectId, ref: 'Course' }, title: String, description: String, weekName: String, lectures: [{ title: String, description: String, day: String, time: String }], postedBy: { type: ObjectId, ref: 'User' } },
  { timestamps: true }
));
const StudyMaterial = mongoose.model('StudyMaterial', new mongoose.Schema(
  { course: { type: ObjectId, ref: 'Course' }, title: String, description: String, fileUrl: String, postedBy: { type: ObjectId, ref: 'User' } },
  { timestamps: true }
));
const Enrollment = mongoose.model('Enrollment', new mongoose.Schema(
  { student: { type: ObjectId, ref: 'User' }, course: { type: ObjectId, ref: 'Course' }, enrollmentType: { type: String, default: 'free' }, listPrice: { type: Number, default: 0 }, paidPrice: { type: Number, default: 0 } },
  { timestamps: true }
));
const Subscription = mongoose.model('Subscription', new mongoose.Schema(
  { user: { type: ObjectId, ref: 'User' }, plan: String, status: { type: String, default: 'Active' }, startDate: Date, endDate: Date, assignedBy: { type: ObjectId, ref: 'User' }, billingLabel: String, pricePaid: Number },
  { timestamps: true }
));

// ── Sample video URLs (YouTube educational content) ────────────────────────
const VIDEOS = {
  webDev: [
    { url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg', title: 'JavaScript for Beginners', duration: 3600 },
    { url: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8', title: 'React JS Crash Course', duration: 4500 },
    { url: 'https://www.youtube.com/watch?v=Oe421EPjeBE', title: 'Node.js and Express.js', duration: 5400 },
    { url: 'https://www.youtube.com/watch?v=1Rs2ND1ryYc', title: 'CSS Grid & Flexbox', duration: 2700 },
    { url: 'https://www.youtube.com/watch?v=4deVCNJq3qc', title: 'TypeScript Full Course', duration: 6000 },
    { url: 'https://www.youtube.com/watch?v=ZxKM3DCV2kE', title: 'REST API with Express', duration: 3300 },
  ],
  dataSci: [
    { url: 'https://www.youtube.com/watch?v=rfscVS0vtbw', title: 'Python for Beginners', duration: 4200 },
    { url: 'https://www.youtube.com/watch?v=vmEHCJofslg', title: 'Pandas Data Analysis', duration: 3900 },
    { url: 'https://www.youtube.com/watch?v=7eh4d6sabA0', title: 'Machine Learning Crash Course', duration: 5700 },
    { url: 'https://www.youtube.com/watch?v=aircAruvnKk', title: 'Neural Networks Explained', duration: 4800 },
    { url: 'https://www.youtube.com/watch?v=RBSUwFGa6Fk', title: 'Data Visualization with Matplotlib', duration: 3000 },
    { url: 'https://www.youtube.com/watch?v=GwIo3gDZCVQ', title: 'SQL for Data Science', duration: 4200 },
  ],
  mobile: [
    { url: 'https://www.youtube.com/watch?v=0-S5a0eXPoc', title: 'React Native Tutorial', duration: 5400 },
    { url: 'https://www.youtube.com/watch?v=VozPNrt-LfE', title: 'Flutter Crash Course', duration: 4500 },
    { url: 'https://www.youtube.com/watch?v=comQ1-x2a1Q', title: 'iOS Swift Basics', duration: 3600 },
    { url: 'https://www.youtube.com/watch?v=fis26HvvDII', title: 'Android Jetpack Compose', duration: 4800 },
  ],
  uiux: [
    { url: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU', title: 'Figma UI Design Tutorial', duration: 3900 },
    { url: 'https://www.youtube.com/watch?v=68w2VwalD5s', title: 'UX Research Methods', duration: 3300 },
    { url: 'https://www.youtube.com/watch?v=II-6dDzc-80', title: 'Design Systems', duration: 4200 },
    { url: 'https://www.youtube.com/watch?v=yNDgFK2Jj1E', title: 'Prototyping in Figma', duration: 2700 },
  ],
  devops: [
    { url: 'https://www.youtube.com/watch?v=pTFZFxd5uri', title: 'Docker for Beginners', duration: 4500 },
    { url: 'https://www.youtube.com/watch?v=X48VuDVv0do', title: 'Kubernetes Full Course', duration: 7200 },
    { url: 'https://www.youtube.com/watch?v=UEzcZFbsO4E', title: 'CI/CD with GitHub Actions', duration: 3600 },
    { url: 'https://www.youtube.com/watch?v=3hLmDS179YE', title: 'AWS for Beginners', duration: 5400 },
  ],
  cyber: [
    { url: 'https://www.youtube.com/watch?v=3Kq1MIfTWCE', title: 'Ethical Hacking Full Course', duration: 7200 },
    { url: 'https://www.youtube.com/watch?v=GG6xIWjsHQo', title: 'Network Security Basics', duration: 4200 },
    { url: 'https://www.youtube.com/watch?v=nzZkKoREEGo', title: 'Linux for Security', duration: 3900 },
    { url: 'https://www.youtube.com/watch?v=fNzpcB7ODxQ', title: 'Penetration Testing Intro', duration: 5100 },
  ],
};

const COVERS = {
  webDev:  'https://images.unsplash.com/photo-1593720219276-0b1eacd0aef4?w=800&q=80',
  dataSci: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  mobile:  'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
  uiux:    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
  devops:  'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&q=80',
  cyber:   'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
};

// ── Helper ────────────────────────────────────────────────────────────────
async function createSectionsAndLectures(courseId, adminId, sectionDefs) {
  const sectionIds = [];
  for (let si = 0; si < sectionDefs.length; si++) {
    const { title, lectures } = sectionDefs[si];
    const lectureIds = [];
    const section = await Section.create({ course: courseId, title, order: si });
    for (let li = 0; li < lectures.length; li++) {
      const lec = await Lecture.create({
        section: section._id, title: lectures[li].title,
        description: `Deep dive into ${lectures[li].title}`,
        videoUrl: lectures[li].url, duration: lectures[li].duration,
        order: li, isPreview: li === 0,
      });
      lectureIds.push(lec._id);
    }
    section.lectures = lectureIds;
    await section.save();
    sectionIds.push(section._id);
  }
  return sectionIds;
}

// ── Main seed ─────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB Atlas\n');

  // Fetch existing base data
  const admin    = await User.findOne({ email: 'admin@edtech.com' });
  const teacher  = await User.findOne({ email: 'teacher@edtech.com' });
  const student1 = await User.findOne({ email: 'student1@edtech.com' });
  const student2 = await User.findOne({ email: 'student2@edtech.com' });

  const catMap = {};
  for (const c of await Category.find()) catMap[c.slug] = c._id;

  const typeMap = {};
  for (const t of await CourseType.find()) typeMap[t.slug] = t._id;

  // ── Teacher profile ──────────────────────────────────────────────────────
  let teacherProfile = await Teacher.findOne({ userId: teacher._id });
  if (!teacherProfile) {
    teacherProfile = await Teacher.create({
      name: 'Jane Teacher', bio: 'Senior software engineer with 8+ years of experience in full-stack development, data science, and cloud technologies. Passionate about making complex topics accessible.', expertise: ['JavaScript', 'React', 'Node.js', 'Python', 'Machine Learning', 'AWS'],
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80',
      socialLinks: { linkedin: 'https://linkedin.com', twitter: 'https://twitter.com', youtube: 'https://youtube.com' },
      userId: teacher._id,
    });
    console.log('  created teacher profile');
  } else {
    console.log('  skip teacher profile (exists)');
  }

  // ── Subscription plans ───────────────────────────────────────────────────
  const plans = [
    {
      plan: 'Basic', price: 9.99, duration: 1, badge: 'Starter', color: '#3b82f6',
      features: ['Access to all free courses', 'Access to Basic tier courses', 'Community forum access', 'Certificate of completion', 'Mobile access'],
      billingOptions: [{ label: 'Monthly', duration: 1, price: 9.99 }, { label: 'Quarterly', duration: 3, price: 24.99 }, { label: 'Yearly', duration: 12, price: 79.99 }],
    },
    {
      plan: 'Pro', price: 19.99, duration: 1, badge: 'Most Popular', color: '#8b5cf6',
      features: ['Everything in Basic', 'Access to all Premium courses', 'Live Q&A sessions', 'Downloadable resources', 'Priority support', '1-on-1 mentorship (2 sessions/month)'],
      billingOptions: [{ label: 'Monthly', duration: 1, price: 19.99 }, { label: 'Quarterly', duration: 3, price: 49.99 }, { label: 'Yearly', duration: 12, price: 149.99 }],
    },
    {
      plan: 'Enterprise', price: 49.99, duration: 1, badge: 'Best Value', color: '#f59e0b',
      features: ['Everything in Pro', 'Unlimited course access', 'Team management dashboard', 'Custom learning paths', 'Dedicated account manager', 'Unlimited mentorship sessions', 'Early access to new courses'],
      billingOptions: [{ label: 'Monthly', duration: 1, price: 49.99 }, { label: 'Quarterly', duration: 3, price: 119.99 }, { label: 'Yearly', duration: 12, price: 399.99 }],
    },
  ];

  for (const p of plans) {
    const exists = await SubscriptionPlanConfig.findOne({ plan: p.plan });
    if (!exists) {
      await SubscriptionPlanConfig.create({ ...p, createdBy: admin._id });
      console.log(`  created subscription plan: ${p.plan}`);
    } else {
      console.log(`  skip plan ${p.plan} (exists)`);
    }
  }

  // ── 30 Courses ───────────────────────────────────────────────────────────
  const courseDefs = [
    // ── Web Development (5) ──
    {
      title: 'Complete JavaScript Mastery', subtitle: 'From zero to hero in modern JavaScript',
      cat: 'web-development', type: 'free', pricing: 'Free', price: 0, cover: COVERS.webDev,
      learn: ['ES6+ features', 'Async/Await & Promises', 'DOM manipulation', 'Event handling', 'Fetch API & REST'],
      reqs: ['Basic computer skills', 'A modern web browser'],
      sections: [
        { title: 'JavaScript Fundamentals', lectures: VIDEOS.webDev.slice(0, 2) },
        { title: 'Advanced Concepts',       lectures: VIDEOS.webDev.slice(2, 4) },
      ],
    },
    {
      title: 'React & Redux Complete Guide', subtitle: 'Build production-ready React applications',
      cat: 'web-development', type: 'premium', pricing: 'Paid', price: 49.99, listPrice: 79.99, cover: COVERS.webDev,
      learn: ['React hooks in depth', 'Redux Toolkit', 'React Router v6', 'Testing with Jest', 'Performance optimization'],
      reqs: ['JavaScript fundamentals', 'HTML & CSS basics'],
      sections: [
        { title: 'React Core',      lectures: VIDEOS.webDev.slice(1, 3) },
        { title: 'State Management', lectures: VIDEOS.webDev.slice(3, 5) },
        { title: 'Testing & Deploy', lectures: VIDEOS.webDev.slice(4, 6) },
      ],
      sub: ['Pro', 'Enterprise'],
    },
    {
      title: 'Node.js Backend Development', subtitle: 'RESTful APIs and microservices with Node',
      cat: 'web-development', type: 'premium', pricing: 'Paid', price: 59.99, listPrice: 89.99, cover: COVERS.webDev,
      learn: ['Express.js framework', 'MongoDB with Mongoose', 'JWT Authentication', 'File uploads', 'Deployment to cloud'],
      reqs: ['JavaScript knowledge', 'Basic terminal skills'],
      sections: [
        { title: 'Express Basics',  lectures: VIDEOS.webDev.slice(2, 4) },
        { title: 'Database & Auth', lectures: VIDEOS.webDev.slice(0, 2) },
      ],
      sub: ['Pro', 'Enterprise'],
    },
    {
      title: 'TypeScript for Professionals', subtitle: 'Type-safe JavaScript at scale',
      cat: 'web-development', type: 'free', pricing: 'Free', price: 0, cover: COVERS.webDev,
      learn: ['TypeScript basics', 'Interfaces & types', 'Generics', 'Decorators', 'Integration with React'],
      reqs: ['JavaScript experience'],
      sections: [
        { title: 'TypeScript Basics',   lectures: VIDEOS.webDev.slice(4, 6) },
        { title: 'Advanced TypeScript', lectures: VIDEOS.webDev.slice(0, 2) },
      ],
    },
    {
      title: 'Full Stack MERN Bootcamp', subtitle: 'MongoDB, Express, React, Node — all in one',
      cat: 'web-development', type: 'premium', pricing: 'Paid', price: 79.99, listPrice: 129.99, cover: COVERS.webDev,
      learn: ['Full stack architecture', 'REST API design', 'React frontend', 'Authentication & security', 'Cloud deployment'],
      reqs: ['HTML/CSS/JS basics'],
      sections: [
        { title: 'Frontend with React', lectures: VIDEOS.webDev.slice(1, 3) },
        { title: 'Backend with Node',   lectures: VIDEOS.webDev.slice(2, 4) },
        { title: 'Deployment',          lectures: VIDEOS.webDev.slice(4, 6) },
      ],
      sub: ['Pro', 'Enterprise'],
    },

    // ── Data Science (5) ──
    {
      title: 'Python for Data Science', subtitle: 'Analyze and visualize data with Python',
      cat: 'data-science', type: 'free', pricing: 'Free', price: 0, cover: COVERS.dataSci,
      learn: ['Python fundamentals', 'NumPy & Pandas', 'Data cleaning', 'Matplotlib & Seaborn', 'Exploratory data analysis'],
      reqs: ['No prior programming experience needed'],
      sections: [
        { title: 'Python Basics',     lectures: VIDEOS.dataSci.slice(0, 2) },
        { title: 'Data Manipulation', lectures: VIDEOS.dataSci.slice(1, 3) },
      ],
    },
    {
      title: 'Machine Learning A–Z', subtitle: 'Hands-on ML with Python and Scikit-learn',
      cat: 'data-science', type: 'premium', pricing: 'Paid', price: 69.99, listPrice: 99.99, cover: COVERS.dataSci,
      learn: ['Supervised learning', 'Unsupervised learning', 'Model evaluation', 'Feature engineering', 'Real-world projects'],
      reqs: ['Python basics', 'Basic math (statistics)'],
      sections: [
        { title: 'Supervised Learning',   lectures: VIDEOS.dataSci.slice(2, 4) },
        { title: 'Unsupervised Learning',  lectures: VIDEOS.dataSci.slice(3, 5) },
      ],
      sub: ['Pro', 'Enterprise'],
    },
    {
      title: 'Deep Learning with TensorFlow', subtitle: 'Neural networks from scratch to production',
      cat: 'data-science', type: 'premium', pricing: 'Paid', price: 79.99, listPrice: 119.99, cover: COVERS.dataSci,
      learn: ['Neural network architecture', 'CNNs & RNNs', 'Transfer learning', 'Model deployment', 'TensorFlow Serving'],
      reqs: ['Python & ML basics'],
      sections: [
        { title: 'Neural Network Basics', lectures: VIDEOS.dataSci.slice(3, 5) },
        { title: 'Advanced Architectures', lectures: VIDEOS.dataSci.slice(2, 4) },
        { title: 'Deployment',            lectures: VIDEOS.dataSci.slice(0, 2) },
      ],
      sub: ['Enterprise'],
    },
    {
      title: 'SQL for Data Analysis', subtitle: 'Master SQL queries for real-world analytics',
      cat: 'data-science', type: 'free', pricing: 'Free', price: 0, cover: COVERS.dataSci,
      learn: ['SELECT & filtering', 'JOINs & subqueries', 'Window functions', 'CTEs', 'Performance tuning'],
      reqs: ['No prerequisites'],
      sections: [
        { title: 'SQL Basics',    lectures: VIDEOS.dataSci.slice(5, 6).concat(VIDEOS.dataSci.slice(0, 1)) },
        { title: 'Advanced SQL',  lectures: VIDEOS.dataSci.slice(1, 3) },
      ],
    },
    {
      title: 'Data Visualization Masterclass', subtitle: 'Tell stories with data using modern tools',
      cat: 'data-science', type: 'premium', pricing: 'Paid', price: 44.99, listPrice: 69.99, cover: COVERS.dataSci,
      learn: ['Matplotlib & Seaborn', 'Plotly interactive charts', 'Dashboard design', 'Storytelling with data'],
      reqs: ['Python basics'],
      sections: [
        { title: 'Static Visualizations',   lectures: VIDEOS.dataSci.slice(4, 6) },
        { title: 'Interactive Dashboards',   lectures: VIDEOS.dataSci.slice(1, 3) },
      ],
      sub: ['Basic', 'Pro', 'Enterprise'],
    },

    // ── Mobile Development (5) ──
    {
      title: 'React Native from Scratch', subtitle: 'Build iOS and Android apps with JavaScript',
      cat: 'mobile-development', type: 'free', pricing: 'Free', price: 0, cover: COVERS.mobile,
      learn: ['React Native basics', 'Navigation', 'State management', 'Native APIs', 'Publishing to stores'],
      reqs: ['React.js knowledge'],
      sections: [
        { title: 'Getting Started', lectures: VIDEOS.mobile.slice(0, 2) },
        { title: 'Navigation & State', lectures: VIDEOS.mobile.slice(1, 3) },
      ],
    },
    {
      title: 'Flutter & Dart Complete Course', subtitle: 'Cross-platform apps with Google Flutter',
      cat: 'mobile-development', type: 'premium', pricing: 'Paid', price: 54.99, listPrice: 84.99, cover: COVERS.mobile,
      learn: ['Dart programming', 'Flutter widgets', 'State management (Bloc)', 'Firebase integration', 'App deployment'],
      reqs: ['Basic programming knowledge'],
      sections: [
        { title: 'Flutter Basics',     lectures: VIDEOS.mobile.slice(1, 3) },
        { title: 'State & Firebase',   lectures: VIDEOS.mobile.slice(2, 4) },
      ],
      sub: ['Pro', 'Enterprise'],
    },
    {
      title: 'iOS Development with Swift', subtitle: 'Native iPhone app development',
      cat: 'mobile-development', type: 'premium', pricing: 'Paid', price: 64.99, listPrice: 99.99, cover: COVERS.mobile,
      learn: ['Swift fundamentals', 'UIKit & SwiftUI', 'Core Data', 'Networking', 'App Store submission'],
      reqs: ['Mac with Xcode', 'Basic programming'],
      sections: [
        { title: 'Swift Basics',  lectures: VIDEOS.mobile.slice(2, 4) },
        { title: 'UIKit & SwiftUI', lectures: VIDEOS.mobile.slice(0, 2) },
      ],
      sub: ['Enterprise'],
    },
    {
      title: 'Android with Jetpack Compose', subtitle: 'Modern Android development',
      cat: 'mobile-development', type: 'premium', pricing: 'Paid', price: 59.99, listPrice: 89.99, cover: COVERS.mobile,
      learn: ['Jetpack Compose UI', 'ViewModel & LiveData', 'Room database', 'Retrofit networking', 'Material Design 3'],
      reqs: ['Kotlin basics helpful'],
      sections: [
        { title: 'Compose Basics',   lectures: VIDEOS.mobile.slice(3, 4).concat(VIDEOS.mobile.slice(0, 1)) },
        { title: 'Architecture',     lectures: VIDEOS.mobile.slice(1, 3) },
      ],
      sub: ['Pro', 'Enterprise'],
    },
    {
      title: 'Mobile UI/UX for Developers', subtitle: 'Design beautiful mobile interfaces',
      cat: 'mobile-development', type: 'free', pricing: 'Free', price: 0, cover: COVERS.mobile,
      learn: ['Mobile design principles', 'Gesture interactions', 'Accessibility', 'Animation basics'],
      reqs: ['Basic mobile app knowledge'],
      sections: [
        { title: 'Design Fundamentals', lectures: VIDEOS.mobile.slice(0, 2) },
        { title: 'Interactions',        lectures: VIDEOS.mobile.slice(2, 4) },
      ],
    },

    // ── UI/UX Design (5) ──
    {
      title: 'UI Design with Figma', subtitle: 'Design stunning interfaces from scratch',
      cat: 'ui-ux-design', type: 'free', pricing: 'Free', price: 0, cover: COVERS.uiux,
      learn: ['Figma fundamentals', 'Auto layout', 'Components & variants', 'Prototyping', 'Handoff to developers'],
      reqs: ['No experience needed'],
      sections: [
        { title: 'Figma Basics',    lectures: VIDEOS.uiux.slice(0, 2) },
        { title: 'Components & Prototyping', lectures: VIDEOS.uiux.slice(2, 4) },
      ],
    },
    {
      title: 'UX Research & Strategy', subtitle: 'User-centered design process',
      cat: 'ui-ux-design', type: 'premium', pricing: 'Paid', price: 49.99, listPrice: 74.99, cover: COVERS.uiux,
      learn: ['User interviews', 'Usability testing', 'Journey mapping', 'Personas', 'A/B testing'],
      reqs: ['Interest in design'],
      sections: [
        { title: 'Research Methods', lectures: VIDEOS.uiux.slice(1, 3) },
        { title: 'Testing & Iteration', lectures: VIDEOS.uiux.slice(0, 2) },
      ],
      sub: ['Basic', 'Pro', 'Enterprise'],
    },
    {
      title: 'Design Systems at Scale', subtitle: 'Build and maintain component libraries',
      cat: 'ui-ux-design', type: 'premium', pricing: 'Paid', price: 59.99, listPrice: 89.99, cover: COVERS.uiux,
      learn: ['Design tokens', 'Component architecture', 'Documentation', 'Storybook', 'Governance'],
      reqs: ['Figma experience'],
      sections: [
        { title: 'Design Token Basics', lectures: VIDEOS.uiux.slice(2, 4) },
        { title: 'Component Library',   lectures: VIDEOS.uiux.slice(0, 2) },
      ],
      sub: ['Pro', 'Enterprise'],
    },
    {
      title: 'Prototyping & Interaction Design', subtitle: 'Bring your designs to life',
      cat: 'ui-ux-design', type: 'free', pricing: 'Free', price: 0, cover: COVERS.uiux,
      learn: ['Micro-interactions', 'Motion design principles', 'Advanced Figma prototyping', 'ProtoPie basics'],
      reqs: ['Basic Figma knowledge'],
      sections: [
        { title: 'Interactions', lectures: VIDEOS.uiux.slice(3, 4).concat(VIDEOS.uiux.slice(0, 1)) },
        { title: 'Advanced Motion', lectures: VIDEOS.uiux.slice(1, 3) },
      ],
    },
    {
      title: 'Product Design Fundamentals', subtitle: 'End-to-end product design process',
      cat: 'ui-ux-design', type: 'premium', pricing: 'Paid', price: 44.99, listPrice: 69.99, cover: COVERS.uiux,
      learn: ['Product thinking', 'Wireframing', 'Visual design', 'Collaboration with PMs', 'Metrics & success'],
      reqs: ['No prerequisites'],
      sections: [
        { title: 'Product Thinking', lectures: VIDEOS.uiux.slice(0, 2) },
        { title: 'From Wireframe to UI', lectures: VIDEOS.uiux.slice(2, 4) },
      ],
      sub: ['Basic', 'Pro', 'Enterprise'],
    },

    // ── DevOps & Cloud (5) ──
    {
      title: 'Docker & Containers Essentials', subtitle: 'Containerize your applications',
      cat: 'devops-cloud', type: 'free', pricing: 'Free', price: 0, cover: COVERS.devops,
      learn: ['Docker basics', 'Dockerfile', 'Docker Compose', 'Container networking', 'Registry & deployment'],
      reqs: ['Basic Linux knowledge'],
      sections: [
        { title: 'Docker Fundamentals', lectures: VIDEOS.devops.slice(0, 2) },
        { title: 'Multi-container Apps', lectures: VIDEOS.devops.slice(1, 3) },
      ],
    },
    {
      title: 'Kubernetes in Production', subtitle: 'Orchestrate containers at scale',
      cat: 'devops-cloud', type: 'premium', pricing: 'Paid', price: 69.99, listPrice: 109.99, cover: COVERS.devops,
      learn: ['Kubernetes architecture', 'Deployments & services', 'ConfigMaps & Secrets', 'Helm charts', 'Monitoring with Prometheus'],
      reqs: ['Docker knowledge'],
      sections: [
        { title: 'K8s Core Concepts', lectures: VIDEOS.devops.slice(1, 3) },
        { title: 'Advanced K8s',      lectures: VIDEOS.devops.slice(2, 4) },
        { title: 'Monitoring',        lectures: VIDEOS.devops.slice(0, 2) },
      ],
      sub: ['Enterprise'],
    },
    {
      title: 'CI/CD with GitHub Actions', subtitle: 'Automate your software delivery pipeline',
      cat: 'devops-cloud', type: 'premium', pricing: 'Paid', price: 44.99, listPrice: 69.99, cover: COVERS.devops,
      learn: ['GitHub Actions basics', 'Workflow automation', 'Testing pipelines', 'Deployment strategies', 'Security scanning'],
      reqs: ['Git knowledge'],
      sections: [
        { title: 'Actions Basics', lectures: VIDEOS.devops.slice(2, 4) },
        { title: 'Advanced Pipelines', lectures: VIDEOS.devops.slice(0, 2) },
      ],
      sub: ['Pro', 'Enterprise'],
    },
    {
      title: 'AWS Cloud Practitioner', subtitle: 'Get started with Amazon Web Services',
      cat: 'devops-cloud', type: 'free', pricing: 'Free', price: 0, cover: COVERS.devops,
      learn: ['AWS core services', 'EC2 & S3', 'IAM security', 'VPC networking', 'Cost management'],
      reqs: ['Basic networking knowledge'],
      sections: [
        { title: 'AWS Basics',    lectures: VIDEOS.devops.slice(3, 4).concat(VIDEOS.devops.slice(0, 1)) },
        { title: 'Core Services', lectures: VIDEOS.devops.slice(1, 3) },
      ],
    },
    {
      title: 'Infrastructure as Code with Terraform', subtitle: 'Provision cloud resources programmatically',
      cat: 'devops-cloud', type: 'premium', pricing: 'Paid', price: 54.99, listPrice: 84.99, cover: COVERS.devops,
      learn: ['Terraform basics', 'Provider configuration', 'State management', 'Modules', 'CI/CD integration'],
      reqs: ['Cloud fundamentals'],
      sections: [
        { title: 'Terraform Basics',   lectures: VIDEOS.devops.slice(0, 2) },
        { title: 'Advanced Terraform', lectures: VIDEOS.devops.slice(2, 4) },
      ],
      sub: ['Pro', 'Enterprise'],
    },

    // ── Cybersecurity (5) ──
    {
      title: 'Ethical Hacking Fundamentals', subtitle: 'Learn to hack ethically and defensively',
      cat: 'cybersecurity', type: 'free', pricing: 'Free', price: 0, cover: COVERS.cyber,
      learn: ['Penetration testing basics', 'Network scanning', 'Vulnerability assessment', 'Social engineering', 'Report writing'],
      reqs: ['Basic networking'],
      sections: [
        { title: 'Hacking Intro',     lectures: VIDEOS.cyber.slice(0, 2) },
        { title: 'Attack Techniques', lectures: VIDEOS.cyber.slice(2, 4) },
      ],
    },
    {
      title: 'Network Security Professional', subtitle: 'Secure networks against modern threats',
      cat: 'cybersecurity', type: 'premium', pricing: 'Paid', price: 64.99, listPrice: 99.99, cover: COVERS.cyber,
      learn: ['Firewall configuration', 'VPN setup', 'IDS/IPS systems', 'Network monitoring', 'Incident response'],
      reqs: ['Networking fundamentals'],
      sections: [
        { title: 'Network Defense', lectures: VIDEOS.cyber.slice(1, 3) },
        { title: 'Monitoring & IR',  lectures: VIDEOS.cyber.slice(2, 4) },
      ],
      sub: ['Pro', 'Enterprise'],
    },
    {
      title: 'Linux Security Hardening', subtitle: 'Secure Linux systems for production',
      cat: 'cybersecurity', type: 'premium', pricing: 'Paid', price: 49.99, listPrice: 74.99, cover: COVERS.cyber,
      learn: ['User & permissions', 'SSH hardening', 'Firewall with iptables', 'Log analysis', 'Intrusion detection'],
      reqs: ['Linux basics'],
      sections: [
        { title: 'System Hardening', lectures: VIDEOS.cyber.slice(2, 4) },
        { title: 'Monitoring',       lectures: VIDEOS.cyber.slice(0, 2) },
      ],
      sub: ['Pro', 'Enterprise'],
    },
    {
      title: 'Web Application Security', subtitle: 'OWASP Top 10 and beyond',
      cat: 'cybersecurity', type: 'free', pricing: 'Free', price: 0, cover: COVERS.cyber,
      learn: ['OWASP Top 10', 'SQL injection', 'XSS & CSRF', 'Secure coding practices', 'Burp Suite basics'],
      reqs: ['Web development basics'],
      sections: [
        { title: 'Common Vulnerabilities', lectures: VIDEOS.cyber.slice(3, 4).concat(VIDEOS.cyber.slice(0, 1)) },
        { title: 'Testing & Mitigation',   lectures: VIDEOS.cyber.slice(1, 3) },
      ],
    },
    {
      title: 'Cloud Security Masterclass', subtitle: 'Secure AWS, Azure, and GCP environments',
      cat: 'cybersecurity', type: 'premium', pricing: 'Paid', price: 74.99, listPrice: 114.99, cover: COVERS.cyber,
      learn: ['Cloud threat landscape', 'IAM best practices', 'Data encryption', 'Compliance frameworks', 'SIEM tools'],
      reqs: ['Cloud & security basics'],
      sections: [
        { title: 'Cloud Threats & IAM',  lectures: VIDEOS.cyber.slice(0, 2) },
        { title: 'Compliance & SIEM',    lectures: VIDEOS.cyber.slice(2, 4) },
      ],
      sub: ['Enterprise'],
    },
  ];

  const createdCourses = [];
  for (const def of courseDefs) {
    const existing = await Course.findOne({ title: def.title });
    if (existing) { console.log(`  skip course: ${def.title}`); createdCourses.push(existing); continue; }

    // Create course first (sections added after)
    const course = await Course.create({
      title: def.title, subtitle: def.subtitle,
      description: `${def.subtitle}. This course covers everything you need to know about ${def.title.toLowerCase()}. You'll gain practical, hands-on skills through real-world projects and exercises.`,
      category: catMap[def.cat],
      courseType: typeMap[def.type] ?? typeMap['free'],
      coverImage: def.cover,
      teachers: [teacherProfile._id],
      visibility: 'Public', pricing: def.pricing,
      price: def.price ?? 0, listPrice: def.listPrice ?? def.price ?? 0,
      includedInSubscription: !!(def.sub?.length),
      allowedSubscriptionPlans: def.sub ?? [],
      status: 'Published', publishedAt: new Date(),
      whatYouWillLearn: def.learn,
      requirements: def.reqs,
      sections: [],
      createdBy: admin._id,
    });

    // Now create sections with the real course ID
    const sectionIds = await createSectionsAndLectures(course._id, admin._id, def.sections);
    await Course.findByIdAndUpdate(course._id, { sections: sectionIds });

    // Study curriculum (2 weeks)
    for (let w = 1; w <= 2; w++) {
      await StudyCurriculum.create({
        course: course._id, title: `Week ${w}: ${def.sections[Math.min(w - 1, def.sections.length - 1)].title}`,
        description: `Structured study plan for week ${w} of ${def.title}`,
        weekName: `Week ${w}`,
        lectures: [
          { title: `Day 1–2: Introduction`, day: 'Mon–Tue', time: '7:00 PM – 9:00 PM' },
          { title: `Day 3–4: Core Concepts`, day: 'Wed–Thu', time: '7:00 PM – 9:00 PM' },
          { title: `Day 5: Practice & Review`, day: 'Fri', time: '6:00 PM – 8:00 PM' },
        ],
        postedBy: admin._id,
      });
    }

    // Study materials (2 per course)
    await StudyMaterial.create([
      { course: course._id, title: `${def.title} — Course Slides`, description: 'Downloadable slide deck covering all lectures in this course.', fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1.pdf', postedBy: admin._id },
      { course: course._id, title: `${def.title} — Cheat Sheet`, description: 'Quick reference cheat sheet for key concepts and commands.', fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF2.pdf', postedBy: admin._id },
    ]);

    createdCourses.push(course);
    console.log(`  created course: ${def.title}`);
  }

  // ── Enroll students in free courses & assign Pro subscription ─────────────
  const freeCourses = createdCourses.filter(c => c.pricing === 'Free').slice(0, 6);
  for (const course of freeCourses) {
    for (const student of [student1, student2]) {
      const exists = await Enrollment.findOne({ student: student._id, course: course._id });
      if (!exists) await Enrollment.create({ student: student._id, course: course._id, enrollmentType: 'free' });
    }
  }
  console.log(`  enrolled both students in ${freeCourses.length} free courses`);

  // Give student1 a Pro subscription
  const existingSub = await Subscription.findOne({ user: student1._id });
  if (!existingSub) {
    const start = new Date();
    const end = new Date(); end.setFullYear(end.getFullYear() + 1);
    await Subscription.create({ user: student1._id, plan: 'Pro', status: 'Active', startDate: start, endDate: end, assignedBy: admin._id, billingLabel: 'Yearly', pricePaid: 149.99 });
    await User.findByIdAndUpdate(student1._id, { activeSubscription: { plan: 'Pro', billingLabel: 'Yearly', startDate: start, endDate: end } });
    console.log('  assigned Pro subscription to student1');
  }

  console.log('\n✓ Full seed complete.');
  console.log(`  ${createdCourses.length} courses | 3 subscription plans | 1 teacher profile`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
