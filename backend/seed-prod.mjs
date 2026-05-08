/**
 * Production seed script — run once to create initial users + categories.
 * Usage: node seed-prod.mjs
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI =
  'mongodb+srv://shaon1132_db_user:YNDAjUcHacKll3dF@cluster0.rkesfzc.mongodb.net/medhabee_db?retryWrites=true&w=majority&appName=Cluster0';

// ── Schemas ────────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    role: { type: String, default: 'Student' },
    purchasedCourses: [],
  },
  { timestamps: true }
);
const User = mongoose.model('User', userSchema);

const categorySchema = new mongoose.Schema(
  { name: String, slug: { type: String, unique: true }, description: String },
  { timestamps: true }
);
const Category = mongoose.model('Category', categorySchema);

const courseTypeSchema = new mongoose.Schema(
  { name: String, slug: { type: String, unique: true }, description: String },
  { timestamps: true }
);
const CourseType = mongoose.model('CourseType', courseTypeSchema);

// ── Data ───────────────────────────────────────────────────────────────────

const users = [
  { name: 'Super Admin',  email: 'admin@edtech.com',    password: 'Admin@123',   role: 'Super Admin' },
  { name: 'Jane Teacher', email: 'teacher@edtech.com',  password: 'Teacher@123', role: 'Teacher'     },
  { name: 'Alice Student',email: 'student1@edtech.com', password: 'Student@123', role: 'Student'     },
  { name: 'Bob Student',  email: 'student2@edtech.com', password: 'Student@123', role: 'Student'     },
];

const categories = [
  { name: 'Web Development',     slug: 'web-development',     description: 'HTML, CSS, JavaScript, React and more' },
  { name: 'Data Science',        slug: 'data-science',        description: 'Python, ML, AI, and analytics'         },
  { name: 'Mobile Development',  slug: 'mobile-development',  description: 'iOS, Android, React Native'            },
  { name: 'UI/UX Design',        slug: 'ui-ux-design',        description: 'Figma, user research, prototyping'     },
  { name: 'DevOps & Cloud',      slug: 'devops-cloud',        description: 'AWS, Docker, CI/CD pipelines'          },
  { name: 'Cybersecurity',       slug: 'cybersecurity',       description: 'Ethical hacking and network security'  },
];

const courseTypes = [
  { name: 'Free',     slug: 'free',     description: 'Freely accessible courses' },
  { name: 'Premium',  slug: 'premium',  description: 'Paid premium courses'      },
  { name: 'Bundle',   slug: 'bundle',   description: 'Course bundle packages'    },
];

// ── Seed ───────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB Atlas');

  // Users
  for (const u of users) {
    const exists = await User.findOne({ email: u.email });
    if (exists) { console.log(`  skip  ${u.email} (already exists)`); continue; }
    const hash = await bcrypt.hash(u.password, 12);
    await User.create({ ...u, password: hash });
    console.log(`  created [${u.role}] ${u.email}`);
  }

  // Categories
  for (const c of categories) {
    await Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true });
    console.log(`  upsert category: ${c.name}`);
  }

  // Course types
  for (const t of courseTypes) {
    await CourseType.findOneAndUpdate({ slug: t.slug }, t, { upsert: true, new: true });
    console.log(`  upsert course type: ${t.name}`);
  }

  console.log('\nSeed complete.');
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
