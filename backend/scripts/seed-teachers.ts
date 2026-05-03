import mongoose from 'mongoose';
import { Teacher } from '../src/models/Teacher.model';

const MONGO_URI = 'mongodb://localhost:27017/medhabee_db';

// Map each existing teacher by name to rich seed data
// Profile images from randomuser.me (stable, free, no attribution required)
const updates: Record<string, {
  bio: string;
  expertise: string[];
  profileImage: string;
  socialLinks?: { website?: string; linkedin?: string; twitter?: string; youtube?: string };
}> = {
  'Priya Patel': {
    bio: 'Priya is a passionate Full-Stack Engineer with over 8 years of experience building scalable web applications at top tech companies. She specializes in React, Node.js, and cloud architecture. Priya believes every learner can master software engineering with the right guidance, and has mentored over 2,000 students worldwide.',
    expertise: ['Full-Stack Development', 'React & Next.js', 'Cloud Architecture', 'Node.js'],
    profileImage: 'https://randomuser.me/api/portraits/women/44.jpg',
    socialLinks: {
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
    },
  },
  'David Kim': {
    bio: 'David is a Data Scientist and Machine Learning Engineer who spent 10 years at Google working on large-scale AI systems. He holds a PhD in Computer Science from Stanford University and is passionate about making machine learning accessible to developers of all skill levels.',
    expertise: ['Machine Learning', 'Data Science', 'Python', 'TensorFlow & PyTorch'],
    profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
    socialLinks: {
      linkedin: 'https://linkedin.com',
      youtube: 'https://youtube.com',
    },
  },
  'Michael Chen': {
    bio: 'Michael is a UX/UI Design Lead with a decade of experience crafting beautiful digital experiences for Fortune 500 companies. He has led design teams at Apple and Airbnb, and brings a human-centered approach to every course he teaches. Michael\'s courses blend design theory with hands-on Figma practice.',
    expertise: ['UX/UI Design', 'Figma & Prototyping', 'Design Systems', 'User Research'],
    profileImage: 'https://randomuser.me/api/portraits/men/85.jpg',
    socialLinks: {
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
      website: 'https://example.com',
    },
  },
  'Nurbanu': {
    bio: 'Nurbanu is a certified Digital Marketing Strategist and Growth Hacker with expertise in SEO, content marketing, and social media advertising. She has grown multiple startups from zero to millions of monthly visitors and brings real-world campaign experience into her practical, results-driven courses.',
    expertise: ['Digital Marketing', 'SEO & Content Strategy', 'Social Media Advertising', 'Growth Hacking'],
    profileImage: 'https://randomuser.me/api/portraits/women/68.jpg',
    socialLinks: {
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
      youtube: 'https://youtube.com',
    },
  },
  'Lajimi': {
    bio: 'Lajimi is a seasoned Cybersecurity Expert and Ethical Hacker with over 12 years of experience in penetration testing and network security. He holds CISSP, CEH, and OSCP certifications and has helped organizations across finance and healthcare secure their digital infrastructure.',
    expertise: ['Cybersecurity', 'Ethical Hacking', 'Network Security', 'Penetration Testing'],
    profileImage: 'https://randomuser.me/api/portraits/men/56.jpg',
    socialLinks: {
      linkedin: 'https://linkedin.com',
      website: 'https://example.com',
    },
  },
};

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const teachers = await Teacher.find();
  console.log(`Found ${teachers.length} teachers to update...`);

  let updated = 0;
  for (const teacher of teachers) {
    const data = updates[teacher.name];
    if (!data) {
      console.log(`⚠️  No seed data for "${teacher.name}", skipping.`);
      continue;
    }

    teacher.bio = data.bio;
    teacher.expertise = data.expertise;
    teacher.profileImage = data.profileImage;

    // Only set socialLinks if not already set or if empty
    if (!teacher.socialLinks || Object.values(teacher.socialLinks).every(v => !v)) {
      teacher.socialLinks = data.socialLinks;
    }

    await teacher.save();
    console.log(`✅ Updated: ${teacher.name}`);
    updated++;
  }

  console.log(`\n🎉 Done! Updated ${updated}/${teachers.length} teachers.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
