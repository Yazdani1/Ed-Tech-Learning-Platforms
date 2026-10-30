// Extra factories for the quiz-bank, quiz-section, subscription and subscription-plan tests.
import { Types } from 'mongoose';

import { QuizBank, type IQuizBank } from '../../src/models/QuizBank.model';
import { QuizSection, type IQuizSection } from '../../src/models/QuizSection.model';
import { Subscription, type ISubscription } from '../../src/models/Subscription.model';
import {
  SubscriptionPlanConfig,
  type ISubscriptionPlanConfig,
} from '../../src/models/SubscriptionPlanConfig.model';

import { createCourse, createTeacherProfile, createUser, nextId } from './index';

import type { ICourse } from '../../src/models/Course.model';
import type { IUser } from '../../src/models/User.model';

export interface QuestionInput {
  question: string;
  options: { text: string; explanation?: string }[];
  correctOptionIndices: number[];
}

export const questionBody = (overrides: Partial<QuestionInput> = {}): QuestionInput => ({
  question: `Question ${nextId()}?`,
  options: [{ text: 'A' }, { text: 'B' }, { text: 'C', explanation: 'because' }, { text: 'D' }],
  correctOptionIndices: [1],
  ...overrides,
});

/** A Teacher user with a profile that teaches a new course. */
export const createTeacherWithCourse = async (): Promise<{ user: IUser; course: ICourse }> => {
  const user = await createUser('Teacher');
  const profile = await createTeacherProfile(user);
  const course = await createCourse({ teachers: [profile._id as Types.ObjectId] });
  return { user, course };
};

export const createQuizSectionDoc = async (
  course: ICourse,
  overrides: Partial<IQuizSection> = {},
): Promise<IQuizSection> => {
  const creator = await createUser('Admin');
  return QuizSection.create({
    course: course._id,
    title: `Quiz section ${nextId()}`,
    createdBy: creator._id,
    ...overrides,
  });
};

/** A quiz bank with two questions (correct: first = [1], second = [0, 2]); option B of the first has an explanation. */
export const createQuizBankDoc = async (
  course: ICourse,
  overrides: Partial<IQuizBank> = {},
): Promise<IQuizBank> => {
  const creator = await createUser('Admin');
  return QuizBank.create({
    course: course._id,
    contextType: 'Course',
    contextId: course._id,
    title: `Quiz bank ${nextId()}`,
    createdBy: creator._id,
    questions: [
      {
        _id: new Types.ObjectId(),
        question: 'First?',
        options: [
          { text: 'A' },
          { text: 'B', explanation: 'B is right' },
          { text: 'C' },
          { text: 'D' },
        ],
        correctOptionIndices: [1],
        order: 0,
      },
      {
        _id: new Types.ObjectId(),
        question: 'Second?',
        options: [{ text: 'A' }, { text: 'B' }, { text: 'C' }, { text: 'D' }],
        correctOptionIndices: [0, 2],
        order: 1,
      },
    ],
    ...overrides,
  });
};

export const createPlanConfig = async (
  overrides: Partial<ISubscriptionPlanConfig> = {},
): Promise<ISubscriptionPlanConfig> => {
  const creator = await createUser('Admin');
  return SubscriptionPlanConfig.create({
    plan: `Plan ${nextId()}`,
    price: 500,
    duration: 1,
    billingOptions: [
      { label: 'Monthly', duration: 1, price: 500 },
      { label: 'Yearly', duration: 12, price: 4800 },
    ],
    features: ['Everything'],
    isActive: true,
    createdBy: creator._id,
    ...overrides,
  });
};

export const createSubscriptionDoc = async (
  user: IUser,
  overrides: Partial<ISubscription> = {},
): Promise<ISubscription> => {
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);
  return Subscription.create({
    user: user._id,
    plan: `Plan ${nextId()}`,
    billingDuration: 1,
    billingLabel: 'Monthly',
    pricePaid: 500,
    startDate: new Date(),
    endDate,
    assignedBy: user._id,
    status: 'Active',
    ...overrides,
  });
};
