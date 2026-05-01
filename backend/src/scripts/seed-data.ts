import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Load env BEFORE importing database config
dotenv.config({ path: path.join(__dirname, '../../.env') });

import '../config/env';
import '../config/db';
import { Category } from '../models/Category.model';
import { Teacher } from '../models/Teacher.model';
import { Course } from '../models/Course.model';
import { User } from '../models/User.model';

const categories = [
	// Programming
	{
		name: 'JavaScript',
		slug: 'javascript-programming',
		description: 'Master JavaScript from basics to advanced concepts',
		icon: 'SiJavascript',
		color: '#F7DF1E',
		topic: 'Programming',
	},
	{
		name: 'Python',
		slug: 'python-programming',
		description: 'Python programming for beginners to experts',
		icon: 'SiPython',
		color: '#3776AB',
		topic: 'Programming',
	},
	// Web Development
	{
		name: 'Web Development',
		slug: 'web-development',
		description: 'Build modern websites and web applications',
		icon: 'SiReact',
		color: '#61DAFB',
		topic: 'Web Development',
	},
	// Mobile Development
	{
		name: 'Mobile Development',
		slug: 'mobile-development',
		description: 'Create native and cross-platform mobile apps',
		icon: 'SiFlutter',
		color: '#02569B',
		topic: 'Mobile Development',
	},
	// Design
	{
		name: 'UI/UX Design',
		slug: 'ui-ux-design',
		description: 'Modern UI/UX design and prototyping',
		icon: 'SiFigma',
		color: '#F24E1E',
		topic: 'Design',
	},
	// AI
	{
		name: 'Generative AI',
		slug: 'generative-ai',
		description: 'Master LLMs, Prompt Engineering, and AI Tools',
		icon: 'SiOpenai',
		color: '#000000',
		topic: 'Artificial Intelligence',
	},
	{
		name: 'Data Science',
		slug: 'data-science',
		description: 'Analysis, Visualization and Machine Learning',
		icon: 'SiPandas',
		color: '#150458',
		topic: 'Data',
	},
	{
		name: 'Cybersecurity',
		slug: 'cybersecurity',
		description: 'Protect systems and networks from digital attacks',
		icon: 'SiKalilinux',
		color: '#557C94',
		topic: 'Security',
	},
	{
		name: 'DevOps & Cloud',
		slug: 'devops-cloud',
		description: 'CI/CD pipelines and cloud infrastructure',
		icon: 'SiDocker',
		color: '#2496ED',
		topic: 'Infrastructure',
	},
	{
		name: 'Game Development',
		slug: 'game-development',
		description: 'Create immersive games using Unity and Unreal Engine',
		icon: 'SiUnity',
		color: '#000000',
		topic: 'Gaming',
	},
];

const teachers = [
	{
		name: 'Sarah Johnson',
		email: 'sarah.johnson@medhabee.com',
		bio: 'Senior Software Engineer at Google with 10+ years of experience in JavaScript and React.',
		expertise: ['JavaScript', 'React', 'TypeScript'],
		avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
		linkedIn: 'https://linkedin.com/in/sarahjohnson',
	},
	{
		name: 'Michael Chen',
		email: 'michael.chen@medhabee.com',
		bio: 'Full-stack developer and open-source contributor. Passionate about teaching modern web technologies.',
		expertise: ['Node.js', 'Next.js', 'MongoDB'],
		avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
		linkedIn: 'https://linkedin.com/in/michaelchen',
	},
	{
		name: 'Emily Rodriguez',
		email: 'emily.rodriguez@medhabee.com',
		bio: 'Python expert and data science educator. Former tech lead at IBM.',
		expertise: ['Python', 'Django', 'Machine Learning'],
		avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
		linkedIn: 'https://linkedin.com/in/emilyrodriguez',
	},
	{
		name: 'David Kim',
		email: 'david.kim@medhabee.com',
		bio: 'Mobile developer specializing in Flutter and React Native. Published 15+ apps on App Store.',
		expertise: ['Flutter', 'React Native', 'Firebase'],
		avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
		linkedIn: 'https://linkedin.com/in/davidkim',
	},
	{
		name: 'Jessica Williams',
		email: 'jessica.williams@medhabee.com',
		bio: 'UI/UX designer turned developer. Expert in CSS, animations, and design systems.',
		expertise: ['CSS', 'Sass', 'Figma', 'UI Design'],
		avatar: 'https://randomuser.me/api/portraits/women/5.jpg',
		linkedIn: 'https://linkedin.com/in/jessicawilliams',
	},
	{
		name: 'James Anderson',
		email: 'james.anderson@medhabee.com',
		bio: 'C++ and systems programming instructor. 15 years of teaching at top universities.',
		expertise: ['C++', 'Data Structures', 'Algorithms'],
		avatar: 'https://randomuser.me/api/portraits/men/6.jpg',
		linkedIn: 'https://linkedin.com/in/jamesanderson',
	},
	{
		name: 'Ayesha Khan',
		email: 'ayesha.khan@medhabee.com',
		bio: 'AI researcher and Python educator. Published researcher in machine learning and NLP.',
		expertise: ['Python', 'TensorFlow', 'AI', 'NLP'],
		avatar: 'https://randomuser.me/api/portraits/women/7.jpg',
		linkedIn: 'https://linkedin.com/in/ayeshakhan',
	},
	{
		name: 'Robert Taylor',
		email: 'robert.taylor@medhabee.com',
		bio: 'Cloud architect and DevOps engineer. AWS certified solutions architect.',
		expertise: ['AWS', 'Docker', 'Kubernetes', 'DevOps'],
		avatar: 'https://randomuser.me/api/portraits/men/8.jpg',
		linkedIn: 'https://linkedin.com/in/roberttaylor',
	},
	{
		name: 'Priya Patel',
		email: 'priya.patel@medhabee.com',
		bio: 'Frontend architect with expertise in React ecosystem and performance optimization.',
		expertise: ['React', 'TypeScript', 'Web Performance'],
		avatar: 'https://randomuser.me/api/portraits/women/9.jpg',
		linkedIn: 'https://linkedin.com/in/priyapatel',
	},
	{
		name: 'Chris Martin',
		email: 'chris.martin@medhabee.com',
		bio: 'Game developer and C++ expert. Built AAA games before transitioning to teaching.',
		expertise: ['C++', 'Game Development', 'Unreal Engine'],
		avatar: 'https://randomuser.me/api/portraits/men/10.jpg',
		linkedIn: 'https://linkedin.com/in/chrismartin',
	},
	{
		name: 'Nina Gupta',
		email: 'nina.gupta@medhabee.com',
		bio: 'Full-stack MERN developer and tech blogger with 50K+ followers.',
		expertise: ['React', 'Node.js', 'MongoDB', 'Express'],
		avatar: 'https://randomuser.me/api/portraits/women/11.jpg',
		linkedIn: 'https://linkedin.com/in/ninagupta',
	},
	{
		name: 'Alex Thompson',
		email: 'alex.thompson@medhabee.com',
		bio: 'Security researcher and ethical hacking instructor. CEH and OSCP certified.',
		expertise: ['Cybersecurity', 'Ethical Hacking', 'Penetration Testing'],
		avatar: 'https://randomuser.me/api/portraits/men/12.jpg',
		linkedIn: 'https://linkedin.com/in/alexthompson',
	},
	{
		name: 'Maria Santos',
		email: 'maria.santos@medhabee.com',
		bio: 'Flutter developer and Google Developer Expert. Built apps used by millions.',
		expertise: ['Flutter', 'Dart', 'Firebase', 'Google Cloud'],
		avatar: 'https://randomuser.me/api/portraits/women/13.jpg',
		linkedIn: 'https://linkedin.com/in/mariasantos',
	},
	{
		name: 'Kevin Lee',
		email: 'kevin.lee@medhabee.com',
		bio: 'Next.js specialist and startup advisor. Helped 20+ startups build their MVPs.',
		expertise: ['Next.js', 'React', 'Vercel', 'Tailwind'],
		avatar: 'https://randomuser.me/api/portraits/men/14.jpg',
		linkedIn: 'https://linkedin.com/in/kevinlee',
	},
	{
		name: 'Rachel Green',
		email: 'rachel.green@medhabee.com',
		bio: 'Data engineer and Python educator. Former data scientist at Netflix.',
		expertise: ['Python', 'Pandas', 'Data Engineering', 'SQL'],
		avatar: 'https://randomuser.me/api/portraits/women/15.jpg',
		linkedIn: 'https://linkedin.com/in/rachelgreen',
	},
	{
		name: 'Daniel Brown',
		email: 'daniel.brown@medhabee.com',
		bio: 'Blockchain developer and Web3 educator. Built DeFi protocols.',
		expertise: ['Blockchain', 'Solidity', 'Web3', 'Ethereum'],
		avatar: 'https://randomuser.me/api/portraits/men/16.jpg',
		linkedIn: 'https://linkedin.com/in/danielbrown',
	},
	{
		name: 'Sophia Martinez',
		email: 'sophia.martinez@medhabee.com',
		bio: 'iOS developer with expertise in Swift and SwiftUI. Apple WWDC scholarship winner.',
		expertise: ['Swift', 'SwiftUI', 'iOS', 'Xcode'],
		avatar: 'https://randomuser.me/api/portraits/women/17.jpg',
		linkedIn: 'https://linkedin.com/in/sophiamartinez',
	},
	{
		name: 'Ryan Wilson',
		email: 'ryan.wilson@medhabee.com',
		bio: 'Backend engineer specializing in Node.js and microservices architecture.',
		expertise: ['Node.js', 'Microservices', 'PostgreSQL', 'Redis'],
		avatar: 'https://randomuser.me/api/portraits/men/18.jpg',
		linkedIn: 'https://linkedin.com/in/ryanwilson',
	},
	{
		name: 'Olivia Clark',
		email: 'olivia.clark@medhabee.com',
		bio: 'UX researcher and accessibility advocate. Making the web usable for everyone.',
		expertise: ['UX Design', 'Accessibility', 'User Research', 'Figma'],
		avatar: 'https://randomuser.me/api/portraits/women/19.jpg',
		linkedIn: 'https://linkedin.com/in/oliviaclark',
	},
	{
		name: 'Ethan Davis',
		email: 'ethan.davis@medhabee.com',
		bio: 'AI engineer and prompt engineering specialist. Building the future with LLMs.',
		expertise: ['AI', 'LLMs', 'Prompt Engineering', 'OpenAI'],
		avatar: 'https://randomuser.me/api/portraits/men/20.jpg',
		linkedIn: 'https://linkedin.com/in/ethandavis',
	},
];

const courses = [
	// JavaScript (5)
	{
		title: 'Complete JavaScript Masterclass',
		description:
			'Learn JavaScript from scratch to advanced. Covers ES6+, async/await, closures, prototypes, and more.',
		category: 'javascript-programming',
		price: 0,
		level: 'Beginner',
		teachers: [0],
		tags: ['javascript', 'es6', 'web development'],
	},
	{
		title: 'JavaScript Algorithms & Data Structures',
		description:
			'Master DSA with JavaScript. Prepare for coding interviews with hands-on practice.',
		category: 'javascript-programming',
		price: 0,
		level: 'Intermediate',
		teachers: [0, 5],
		tags: ['algorithms', 'data structures', 'interview prep'],
	},
	{
		title: 'Advanced JavaScript Patterns',
		description:
			'Design patterns, performance optimization, memory management, and advanced debugging.',
		category: 'javascript-programming',
		price: 0,
		level: 'Advanced',
		teachers: [8],
		tags: ['advanced', 'design patterns', 'performance'],
	},
	{
		title: 'Testing JavaScript Applications',
		description:
			'Unit tests, integration tests, and E2E testing with Jest, Cypress, and Playwright.',
		category: 'javascript-programming',
		price: 0,
		level: 'Intermediate',
		teachers: [8],
		tags: ['testing', 'jest', 'cypress', 'playwright'],
	},
	{
		title: 'Functional Programming in JS',
		description:
			'Learn pure functions, immutability, and composition in modern JavaScript.',
		category: 'javascript-programming',
		price: 0,
		level: 'Advanced',
		teachers: [0, 8],
		tags: ['fp', 'javascript', 'clean code'],
	},
	// Python (5)
	{
		title: 'Python for Beginners',
		description:
			'Start your programming journey with Python. No prior experience needed.',
		category: 'python-programming',
		price: 0,
		level: 'Beginner',
		teachers: [2],
		tags: ['python', 'beginners', 'programming'],
	},
	{
		title: 'Python Automation & Scripting',
		description:
			'Automate tasks with Python. Web scraping, file handling, and system administration.',
		category: 'python-programming',
		price: 0,
		level: 'Intermediate',
		teachers: [2],
		tags: ['automation', 'scripting', 'web scraping'],
	},
	{
		title: 'Django for Web Professionals',
		description:
			'Build robust, secure web applications quickly using the Django framework.',
		category: 'python-programming',
		price: 0,
		level: 'Intermediate',
		teachers: [2],
		tags: ['django', 'web', 'backend'],
	},
	{
		title: 'FastAPI Microservices',
		description: 'Design and deploy high-performance APIs with Python FastAPI.',
		category: 'python-programming',
		price: 0,
		level: 'Advanced',
		teachers: [6, 17],
		tags: ['fastapi', 'microservices', 'python'],
	},
	{
		title: 'Scientific Computing with Python',
		description:
			'Leverage Python for complex scientific and mathematical calculations.',
		category: 'python-programming',
		price: 0,
		level: 'Advanced',
		teachers: [6, 14],
		tags: ['scipy', 'math', 'python'],
	},
	// Web Development (5)
	{
		title: 'Modern Web Development Bootcamp',
		description: 'Everything from HTML5/CSS3 to modern frontend frameworks.',
		category: 'web-development',
		price: 0,
		level: 'Beginner',
		teachers: [0, 10],
		tags: ['html', 'css', 'javascript'],
	},
	{
		title: 'React 19 & Next.js 15 Deep Dive',
		description:
			'Master the latest features of React and the Next.js App Router.',
		category: 'web-development',
		price: 0,
		level: 'Intermediate',
		teachers: [13, 8],
		tags: ['react', 'nextjs', 'ssr'],
	},
	{
		title: 'Fullstack MERN Development',
		description: 'Build a complete Social Media platform using MERN stack.',
		category: 'web-development',
		price: 0,
		level: 'Advanced',
		teachers: [1, 10],
		tags: ['mern', 'fullstack', 'mongodb'],
	},
	{
		title: 'Web Performance Engineering',
		description:
			'Optimize Core Web Vitals and app performance for a better UX.',
		category: 'web-development',
		price: 0,
		level: 'Advanced',
		teachers: [8],
		tags: ['performance', 'optimization', 'cwv'],
	},
	{
		title: 'GraphQL API Design',
		description: 'Build flexible and scalable APIs with GraphQL and Apollo.',
		category: 'web-development',
		price: 0,
		level: 'Intermediate',
		teachers: [1],
		tags: ['graphql', 'api', 'backend'],
	},
	// Mobile Development (5)
	{
		title: 'Flutter & Dart Complete Guide',
		description:
			'Build cross-platform mobile apps with Flutter and Dart from scratch.',
		category: 'mobile-development',
		price: 0,
		level: 'Beginner',
		teachers: [3, 12],
		tags: ['flutter', 'dart', 'mobile'],
	},
	{
		title: 'React Native Pro Mastery',
		description: 'Build native iOS and Android apps using React and Expo.',
		category: 'mobile-development',
		price: 0,
		level: 'Intermediate',
		teachers: [3],
		tags: ['react native', 'expo'],
	},
	{
		title: 'SwiftUI Essentials',
		description:
			'Modern iOS app development using Swift and SwiftUI framework.',
		category: 'mobile-development',
		price: 0,
		level: 'Beginner',
		teachers: [16],
		tags: ['ios', 'swift', 'apple'],
	},
	{
		title: 'Android Development with Kotlin',
		description:
			'Learn Jetpack Compose and modern Android architecture with Kotlin.',
		category: 'mobile-development',
		price: 0,
		level: 'Intermediate',
		teachers: [3, 12],
		tags: ['android', 'kotlin', 'jetpack'],
	},
	{
		title: 'Mobile App Security',
		description:
			'Learn how to secure your mobile applications from common threats.',
		category: 'mobile-development',
		price: 0,
		level: 'Advanced',
		teachers: [11],
		tags: ['security', 'mobile'],
	},
	// UI/UX Design (5)
	{
		title: 'Figma for UI Designers',
		description:
			'Master Figma from the ground up and build stunning user interfaces.',
		category: 'ui-ux-design',
		price: 0,
		level: 'Beginner',
		teachers: [4],
		tags: ['figma', 'ui', 'design'],
	},
	{
		title: 'UX Research Fundamentals',
		description:
			'Learn how to conduct user research and analyze behavioral data.',
		category: 'ui-ux-design',
		price: 0,
		level: 'Intermediate',
		teachers: [18],
		tags: ['ux', 'research'],
	},
	{
		title: 'Typography & Visual Design',
		description:
			'Deep dive into typography, color theory, and layout principles.',
		category: 'ui-ux-design',
		price: 0,
		level: 'Beginner',
		teachers: [4],
		tags: ['typography', 'visuals'],
	},
	{
		title: 'Design Systems at Scale',
		description:
			'Learn how to build and maintain design systems for large teams.',
		category: 'ui-ux-design',
		price: 0,
		level: 'Advanced',
		teachers: [4, 18],
		tags: ['design-system', 'figma'],
	},
	{
		title: 'Web Accessibility for Designers',
		description: 'Designing inclusive products that follow WCAG guidelines.',
		category: 'ui-ux-design',
		price: 0,
		level: 'Intermediate',
		teachers: [18],
		tags: ['a11y', 'accessibility'],
	},
	// Generative AI (5)
	{
		title: 'ChatGPT Prompt Engineering',
		description:
			'Learn the secrets of engineering high-quality prompts for LLMs.',
		category: 'generative-ai',
		price: 0,
		level: 'Beginner',
		teachers: [19],
		tags: ['chatgpt', 'openai', 'prompts'],
	},
	{
		title: 'Building AI Apps with LangChain',
		description:
			'Create powerful LLM-powered applications using LangChain and Python.',
		category: 'generative-ai',
		price: 0,
		level: 'Intermediate',
		teachers: [19, 6],
		tags: ['langchain', 'ai', 'python'],
	},
	{
		title: 'Stable Diffusion Masterclass',
		description:
			'Master AI art generation and image processing with Stable Diffusion.',
		category: 'generative-ai',
		price: 0,
		level: 'Intermediate',
		teachers: [19, 4],
		tags: ['ai-art', 'diffusion'],
	},
	{
		title: 'Vector Databases for AI',
		description:
			'Deep dive into Pinecone and Weaviate for RAG-based AI applications.',
		category: 'generative-ai',
		price: 0,
		level: 'Advanced',
		teachers: [19, 17],
		tags: ['rag', 'vector-db'],
	},
	{
		title: 'Ethical AI & Governance',
		description:
			'Understand the ethical implications and regulations of AI technology.',
		category: 'generative-ai',
		price: 0,
		level: 'Beginner',
		teachers: [19],
		tags: ['ethics', 'ai-policy'],
	},
	// Data Science (5)
	{
		title: 'Data Analysis with Pandas',
		description:
			'Master data manipulation and analysis using the Python Pandas library.',
		category: 'data-science',
		price: 0,
		level: 'Intermediate',
		teachers: [14],
		tags: ['pandas', 'data'],
	},
	{
		title: 'Machine Learning A-Z',
		description: 'Comprehensive guide to supervised and unsupervised learning.',
		category: 'data-science',
		price: 0,
		level: 'Intermediate',
		teachers: [6, 14],
		tags: ['ml', 'scikit-learn'],
	},
	{
		title: 'Big Data with Spark & Scala',
		description: 'Learn how to process massive datasets using Apache Spark.',
		category: 'data-science',
		price: 0,
		level: 'Advanced',
		teachers: [14, 7],
		tags: ['spark', 'big-data'],
	},
	{
		title: 'Tableau for Data Visualization',
		description: 'Create stunning interactive dashboards with Tableau.',
		category: 'data-science',
		price: 0,
		level: 'Beginner',
		teachers: [14],
		tags: ['tableau', 'viz'],
	},
	{
		title: 'Mathematical Foundations for DS',
		description: 'Linear algebra, calculus, and probability for data science.',
		category: 'data-science',
		price: 0,
		level: 'Intermediate',
		teachers: [14],
		tags: ['math', 'ds'],
	},
	// Cybersecurity (5)
	{
		title: 'Ethical Hacking Bootcamp',
		description:
			'Learn network penetration testing and ethical hacking from scratch.',
		category: 'cybersecurity',
		price: 0,
		level: 'Beginner',
		teachers: [11],
		tags: ['security', 'hacking'],
	},
	{
		title: 'Web Application Security',
		description:
			'Master OWASP Top 10 and defend your web apps against attacks.',
		category: 'cybersecurity',
		price: 0,
		level: 'Intermediate',
		teachers: [11],
		tags: ['web-sec', 'owasp'],
	},
	{
		title: 'Network Security Fundamentals',
		description:
			'Learn about firewalls, VPNs, and secure network architecture.',
		category: 'cybersecurity',
		price: 0,
		level: 'Beginner',
		teachers: [11],
		tags: ['network', 'firewall'],
	},
	{
		title: 'Incident Response & Handling',
		description:
			'Prepare for and respond to cybersecurity incidents in the enterprise.',
		category: 'cybersecurity',
		price: 0,
		level: 'Advanced',
		teachers: [11, 7],
		tags: ['incident-response'],
	},
	{
		title: 'Cloud Security with AWS',
		description:
			'Secure your AWS infrastructure using IAM, VPC, and GuardDuty.',
		category: 'cybersecurity',
		price: 0,
		level: 'Intermediate',
		teachers: [7, 11],
		tags: ['aws', 'security'],
	},
	// DevOps & Cloud (5)
	{
		title: 'Docker & Kubernetes Mastery',
		description:
			'Master containerization and orchestration for modern applications.',
		category: 'devops-cloud',
		price: 0,
		level: 'Intermediate',
		teachers: [7],
		tags: ['docker', 'k8s'],
	},
	{
		title: 'AWS Solutions Architect',
		description:
			'Comprehensive guide to passing the AWS Solutions Architect exam.',
		category: 'devops-cloud',
		price: 0,
		level: 'Intermediate',
		teachers: [7],
		tags: ['aws', 'cloud'],
	},
	{
		title: 'CI/CD with GitHub Actions',
		description:
			'Automate your software delivery pipeline with GitHub Actions.',
		category: 'devops-cloud',
		price: 0,
		level: 'Beginner',
		teachers: [7, 8],
		tags: ['cicd', 'github'],
	},
	{
		title: 'Terraform Infrastructure as Code',
		description:
			'Manage your cloud infrastructure safely and efficiently with Terraform.',
		category: 'devops-cloud',
		price: 0,
		level: 'Advanced',
		teachers: [7],
		tags: ['terraform', 'iac'],
	},
	{
		title: 'Monitoring with Prometheus',
		description: 'Implement robust monitoring and alerting for your services.',
		category: 'devops-cloud',
		price: 0,
		level: 'Intermediate',
		teachers: [7, 17],
		tags: ['monitoring', 'devops'],
	},
	// Game Development & Tools (5)
	{
		title: 'Game Development with C++',
		description:
			'Build high-performance 2D and 3D games using C++ and Unreal Engine.',
		category: 'game-development',
		price: 0,
		level: 'Advanced',
		teachers: [9, 5],
		tags: ['gamedev', 'cpp', 'unreal'],
	},
	{
		title: 'Unity 2D Game Masterclass',
		description:
			'Build and publish your first 2D game using Unity and C# from scratch.',
		category: 'game-development',
		price: 0,
		level: 'Beginner',
		teachers: [9],
		tags: ['unity', 'csharp'],
	},
	{
		title: 'C# Programming for Games',
		description:
			'Master C# specifically for Game Development and Unity scripts.',
		category: 'game-development',
		price: 0,
		level: 'Beginner',
		teachers: [9, 5],
		tags: ['csharp', 'gaming'],
	},
	{
		title: '3D Modeling for Game Dev',
		description:
			'Learn Blender to create high-quality 3D assets for your games.',
		category: 'game-development',
		price: 0,
		level: 'Intermediate',
		teachers: [4, 9],
		tags: ['3d', 'blender'],
	},
	{
		title: 'Mobile Game Optimization',
		description: 'How to optimize Unity games for mobile performance.',
		category: 'game-development',
		price: 0,
		level: 'Advanced',
		teachers: [9, 3],
		tags: ['optimization', 'mobile'],
	},
	{
		title: 'Git & GitHub for Professionals',
		description: 'Master version control and collaborative workflows.',
		category: 'javascript-programming',
		price: 0,
		level: 'Beginner',
		teachers: [8],
		tags: ['git', 'github'],
	},
	{
		title: 'Database Design & SQL',
		description: 'Learn relational database design and complex SQL queries.',
		category: 'python-programming',
		price: 0,
		level: 'Beginner',
		teachers: [17, 1],
		tags: ['sql', 'database'],
	},
	{
		title: 'Career in Tech: Roadmap',
		description: 'Everything you need to know to land your first job in tech.',
		category: 'javascript-programming',
		price: 0,
		level: 'Beginner',
		teachers: [0, 1],
		tags: ['career', 'jobs'],
	},
];

async function seed() {
	console.log('🚀 Initializing Seed Process for 50 Courses...');

	// Use MONGO_URI to match your config/db.ts
	const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
	if (!mongoUri) {
		throw new Error('Neither MONGO_URI nor MONGODB_URI is defined in .env');
	}

	console.log('⏳ Connecting to MongoDB...');
	await mongoose.connect(mongoUri);
	console.log('✅ Connected to Database');

	// Clear existing data
	console.log('🧹 Clearing existing data...');
	await Category.deleteMany({});
	await Teacher.deleteMany({});
	await Course.deleteMany({});

	// Get or Create admin user by Email
	let admin = await User.findOne({ email: 'admin@medhabee.com' });
	if (!admin) {
		console.log('👤 Admin user not found. Creating default admin...');
		const hashedPassword = await bcrypt.hash('Admin@1234', 12);
		admin = await User.create({
			name: 'Admin User',
			email: 'admin@medhabee.com',
			password: hashedPassword,
			role: 'Super Admin',
		});
	} else {
		console.log(
			'👤 Found existing user. Promoting to Super Admin for seeding...',
		);
		admin.role = 'Super Admin';
		await admin.save();
	}
	console.log(`🔑 Using Admin: ${admin.email} (${admin._id})`);

	// Create categories
	console.log('📂 Creating categories...');
	const createdCategories = await Category.insertMany(
		categories.map((c) => ({ ...c, createdBy: admin._id })),
	);
	console.log(`✅ Created ${createdCategories.length} categories`);

	// Create teachers
	console.log('Creating teachers...');
	const createdTeachers = await Teacher.insertMany(
		teachers.map((t) => ({
			name: t.name,
			email: t.email,
			bio: t.bio,
			expertise: t.expertise,
			profileImage: t.avatar, // Mapping avatar to profileImage for frontend compatibility
			user: admin._id,
			isApproved: true,
			socialLinks: { linkedin: t.linkedIn || '' },
		})),
	);
	console.log(`✅ Created ${createdTeachers.length} teachers`);

	// Create courses
	console.log('Creating courses...');
	const courseDocs = courses
		.map((c, i) => {
			const cat = createdCategories.find((cat) => cat.slug === c.category);
			if (!cat) {
				console.error(
					`❌ Category slug "${c.category}" not found for course "${c.title}"`,
				);
				return null;
			}

			const teacherRefs = c.teachers.map((idx) => createdTeachers[idx]._id);
			const thumbIdx = (i % 20) + 1;
			return {
				title: c.title,
				description: c.description,
				shortDescription: c.description.substring(0, 120) + '...',
				category: cat!._id,
				teachers: teacherRefs,
				coverImage: `https://picsum.photos/seed/course${thumbIdx}/800/450`,
				pricing: c.price === 0 ? 'Free' : 'Paid',
				price: c.price,
				level: c.level as 'Beginner' | 'Intermediate' | 'Advanced',
				visibility: 'Public' as const,
				status: 'Published' as const,
				tags: c.tags,
				requirements: [
					'A computer with internet access',
					'Basic knowledge of computers',
				],
				whatYouWillLearn: [
					`Master ${c.title} from scratch`,
					'Build real-world projects',
					'Prepare for industry challenges',
				],
				createdBy: admin._id,
				totalDuration: Math.floor(Math.random() * 40) + 5,
				totalLectures: Math.floor(Math.random() * 60) + 10,
				totalStudents: Math.floor(Math.random() * 5000) + 100,
				rating: (Math.random() * 2 + 3).toFixed(1),
			};
		})
		.filter(Boolean);

	const createdCourses = await Course.insertMany(courseDocs as any[]);
	console.log(`✅ Created ${createdCourses.length} courses\n`);

	// Summary
	console.log('═══════════════════════════════════════');
	console.log('🎉 Seed complete!');
	console.log(`   Categories : ${createdCategories.length}`);
	console.log(`   Teachers   : ${createdTeachers.length}`);
	console.log(`   Courses    : ${createdCourses.length}`);
	console.log('═══════════════════════════════════════');

	process.exit(0);
}

seed().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
