export type UserRole = 'Super Admin' | 'Admin' | 'Moderator' | 'Teacher' | 'Student';
export type SubscriptionPlan = string;
export type CourseVisibility = 'Public' | 'Private';
export type CoursePricing = 'Free' | 'Paid';
export type CourseStatus = 'Draft' | 'Published';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  communityPoints?: number;
  activeSubscription?: {
    plan: SubscriptionPlan;
    billingDuration?: number;
    billingLabel?: string;
    startDate: string;
    endDate: string;
  };
  enrollmentSummary?: {
    free: number;
    paid: number;
    subscription: number;
    total: number;
  };
  spendingSummary?: {
    paidCourses: number;
    subscriptions: number;
    total: number;
  };
  purchasedCourses: string[];
  createdAt: string;
  updatedAt?: string;
}

export type CommunityReactionType = 'Like' | 'Love' | 'Wow' | 'Sad' | 'Angry' | 'Helpful';

export interface ICommunityChannel {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICommunityBadge {
  _id: string;
  name: string;
  icon: string;
  requiredPoints: number;
  description?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICommunityReaction {
  user: string | Pick<IUser, '_id' | 'name' | 'avatar' | 'role'>;
  type: CommunityReactionType;
  createdAt: string;
}

export interface ICommunityReply {
  _id: string;
  post: string;
  body: string;
  author: Pick<IUser, '_id' | 'name' | 'avatar' | 'role' | 'communityPoints'>;
  reactions: ICommunityReaction[];
  isAccepted: boolean;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICommunityPost {
  _id: string;
  channel: ICommunityChannel;
  title: string;
  description: string;
  imageUrl?: string;
  author: Pick<IUser, '_id' | 'name' | 'avatar' | 'role' | 'communityPoints'>;
  reactions: ICommunityReaction[];
  replies: ICommunityReply[];
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICommunityPointRule {
  _id: string;
  key: 'acceptedAnswer' | 'createPost' | 'createReply' | 'receiveReaction';
  label: string;
  points: number;
}

export interface ICommunityOverview {
  channels: ICommunityChannel[];
  channelPostCounts: Record<string, number>;
  posts: ICommunityPost[];
  badges: ICommunityBadge[];
  guestLimited: boolean;
}

export interface ICommunityPostDetail {
  post: ICommunityPost;
  badges: ICommunityBadge[];
  channels: ICommunityChannel[];
}

export interface IChatConversation {
  _id: string;
  student: Pick<IUser, '_id' | 'name' | 'avatar' | 'email'>;
  unreadByStaff: number;
  unreadByStudent: number;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IChatMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar: string;
  content: string;
  createdAt: string;
}

export interface IChatTypingEvent {
  conversationId: string;
  userId: string;
  userName: string;
  userRole: string;
  isTyping: boolean;
}

export interface IChatPresenceEvent {
  studentId: string;
  isOnline: boolean;
}

export type NotificationPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export interface INotificationRecipient {
  user: string;
  readAt?: string;
}

export interface INotification {
  _id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  targetRoles: UserRole[];
  sentBy: Pick<IUser, '_id' | 'name' | 'role' | 'avatar'>;
  recipients: INotificationRecipient[];
  isRead?: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ITeacher {
  _id: string;
  name: string;
  bio: string;
  profileImage?: string;
  expertise: string[];
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
  };
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface ICourseType {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface ILecture {
  _id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration?: number; // seconds
  order: number;
  isPreview: boolean;
}

export interface ISection {
  _id: string;
  title: string;
  order: number;
  lectures: ILecture[];
}

export type EnrollmentType = 'free' | 'paid' | 'subscription';

export interface ICourse {
  _id: string;
  title: string;
  subtitle?: string;
  description: string;
  coverImage?: string;
  category: ICategory;
  courseType?: ICourseType;
  startDate?: string;
  endDate?: string;
  teachers: ITeacher[];
  visibility: CourseVisibility;
  pricing: CoursePricing;
  price?: number;
  listPrice?: number;
  discountPrice?: number;
  discountPercent?: number;
  discountEndsAt?: string;
  includedInSubscription: boolean;
  allowedSubscriptionPlans: SubscriptionPlan[];
  status: CourseStatus;
  publishedAt?: string;
  whatYouWillLearn: string[];
  whatYouWillGet: string[];
  requirements: string[];
  sections: ISection[];
  createdAt: string;
  updatedAt?: string;
  enrollmentType?: EnrollmentType;
  enrollmentStats?: {
    totalEnrollments: number;
    lifetimeEarned: number;
    thisMonthCount: number;
    thisMonthEarned: number;
    previousMonthCount: number;
    previousMonthEarned: number;
  };
}

export interface ISubscription {
  _id: string;
  user: Pick<IUser, '_id' | 'name' | 'email'>;
  plan: SubscriptionPlan;
  billingDuration?: number;
  billingLabel?: string;
  pricePaid?: number;
  status: 'Active' | 'Expired' | 'Cancelled';
  startDate: string;
  endDate: string;
  assignedBy?: Pick<IUser, '_id' | 'name'>;
}

export interface ISubscriptionPlanConfig {
  _id: string;
  plan: SubscriptionPlan;
  price: number;
  duration: number;
  billingOptions: Array<{
    label: string;
    duration: number;
    price: number;
  }>;
  features: string[];
  badge?: string;
  color?: string;
  isActive: boolean;
  courseCount: number;
}

export type DateRange = '7d' | '30d' | 'lifetime';

export interface IPerformanceData {
  thisMonthRevenue: number;
  totalRevenue: number;
  thisMonthCount: number;
  totalEnrollments: number;
  chartData: Array<{ date: string; revenue: number; enrollments: number }>;
  breakdown: { free: number; paid: number; subscription: number };
}

export interface IDashboardSummary {
  totals: {
    users: number;
    students: number;
    teachers: number;
    courses: number;
    publishedCourses: number;
    draftCourses: number;
    categories: number;
    enrollments: number;
    thisMonthEnrollments: number;
    activeSubscriptions: number;
    openQuestions: number;
    totalRevenue: number;
    thisMonthRevenue: number;
    courseRevenue: number;
    subscriptionRevenue: number;
  };
  roleCounts: Array<{ label: UserRole; value: number }>;
  courseStatusCounts: Array<{ label: CourseStatus; value: number }>;
  coursePricingCounts: Array<{ label: CoursePricing; value: number }>;
  revenueTimeline: Array<{
    date: string;
    enrollments: number;
    courseRevenue: number;
    subscriptionRevenue: number;
    totalRevenue: number;
  }>;
  topCourses: Array<{
    course: Pick<ICourse, '_id' | 'title' | 'coverImage' | 'pricing' | 'price' | 'listPrice' | 'discountPrice' | 'status'> | null;
    enrollments: number;
  }>;
  recentEnrollments: Array<{
    _id: string;
    student: Pick<IUser, '_id' | 'name' | 'email'>;
    course: Pick<ICourse, '_id' | 'title'>;
    enrollmentType: EnrollmentType;
    createdAt: string;
  }>;
  recentUsers: Array<Pick<IUser, '_id' | 'name' | 'email' | 'role' | 'createdAt'>>;
}

export interface IEnrollment {
  _id: string;
  student: Pick<IUser, '_id' | 'name' | 'email' | 'avatar'>;
  course: Pick<ICourse, '_id' | 'title' | 'price' | 'listPrice' | 'discountPrice' | 'pricing'>;
  enrollmentType: EnrollmentType;
  listPrice: number;
  paidPrice: number;
  discountAmount: number;
  discountPercent: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface IEnrollmentStats {
  total: number;
  free: number;
  paid: number;
  subscription: number;
  lifetimeEarned: number;
  thisMonthCount: number;
  thisMonthEarned: number;
}

export interface IActiveCourseDiscount {
  courseCount: number;
  discountPercent: number;
  discountEndsAt: string;
  maxListPrice?: number;
  minDiscountPrice?: number;
}

export interface ICourseStudentEnrollment {
  _id: string;
  student: Pick<IUser, '_id' | 'name' | 'avatar'> & Partial<Pick<IUser, 'email'>>;
  enrollmentType: EnrollmentType;
  createdAt: string;
  updatedAt: string;
}

export interface IStudyMaterial {
  _id: string;
  course: string;
  title: string;
  description: string;
  fileUrl?: string;
  postedBy: {
    _id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IAnnouncement {
  _id: string;
  course: string;
  title: string;
  description: string;
  postedBy: {
    _id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IStudyCurriculumLecture {
  _id?: string;
  title: string;
  description?: string;
  day: string;
  time: string;
}

export interface IStudyCurriculum {
  _id: string;
  course: string;
  title: string;
  description: string;
  weekName: string;
  lectures: IStudyCurriculumLecture[];
  postedBy: {
    _id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IQuestion {
  _id: string;
  course: string;
  title: string;
  description: string;
  postedBy: {
    _id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  upvotes: string[];
  isResolved: boolean;
  resolvedBy?: {
    _id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  resolvedAt?: string;
  answerCount: number;
  staffAnswerCount: number;
  hasStaffAnswer: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAnswer {
  _id: string;
  question: string;
  body: string;
  postedBy: {
    _id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  upvotes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ICourseQuestionGroup {
  course: {
    _id: string;
    title: string;
    subtitle?: string;
    status?: CourseStatus;
    coverImage?: string;
  };
  questions: IQuestion[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  total?: number;
  page?: number;
  limit?: number;
  totalUsers?: number;
  pagination?: IPaginationMeta;
  filterCounts?: ICourseFilterCounts;
}

export interface ICourseFilterCounts {
  courseTypes: Record<string, number>;
  categories: Record<string, number>;
  pricing: Partial<Record<CoursePricing, number>>;
  subscriptionPlans: Partial<Record<SubscriptionPlan, number>>;
}

export type HomeHeroPostVisibility = 'Public' | 'Private';

export interface IHomeHeroPost {
  _id: string;
  imageUrl: string;
  imagePublicId?: string;
  imageWidth?: number;
  imageHeight?: number;
  visibility: HomeHeroPostVisibility;
  scheduledVisibility?: HomeHeroPostVisibility;
  publishAt?: string;
  order: number;
  createdBy?: Pick<IUser, '_id' | 'name' | 'role'>;
  createdAt: string;
  updatedAt: string;
}

export interface ISiteLogo {
  _id: string;
  imageUrl: string;
  imagePublicId?: string;
  imageWidth?: number;
  imageHeight?: number;
  updatedBy?: Pick<IUser, '_id' | 'name' | 'role'>;
  createdAt: string;
  updatedAt: string;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IQuizOption {
  _id?: string;
  text: string;
  explanation?: string;
}

export interface IQuizQuestion {
  _id: string;
  question: string;
  options: IQuizOption[];
  correctOptionIndices: number[];
  order: number;
}

export interface IQuizSection {
  _id: string;
  course: string;
  title: string;
  order: number;
  isFreePreview: boolean;
  createdBy: Pick<IUser, '_id' | 'name' | 'avatar' | 'role'>;
  createdAt: string;
  updatedAt: string;
}

export type QuizContextType = 'Section' | 'Announcement' | 'Course';

export interface IQuizBank {
  _id: string;
  course: string;
  quizSection?: string;
  contextType?: QuizContextType;
  contextId?: string;
  title: string;
  description?: string;
  isFreePreview: boolean;
  questions: IQuizQuestion[];
  createdBy: {
    _id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IPublicQuizSection {
  _id: string;
  title: string;
  isFreePreview: boolean;
  banks: IQuizBank[];
}

export type IPublicCourse = Pick<
  ICourse,
  '_id' | 'title' | 'subtitle' | 'coverImage' | 'pricing' | 'price' | 'listPrice' | 'discountPrice' | 'discountPercent' | 'includedInSubscription'
>;

export interface IPublicCourseQuizTree {
  course: IPublicCourse;
  sections: IPublicQuizSection[];
  lockedBankCount: number;
  lockedQuestionCount: number;
}

export interface IAttemptAnswer {
  questionId: string;
  selectedOptionIndices: number[];
  isCorrect: boolean;
}

export interface IQuizAttempt {
  _id: string;
  student: string;
  quizBank: string;
  course: string;
  answers: IAttemptAnswer[];
  createdAt: string;
  updatedAt: string;
}
