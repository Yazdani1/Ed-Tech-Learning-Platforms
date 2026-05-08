import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Subscription } from '../models/Subscription.model';
import { SubscriptionPlanConfig, type ISubscriptionPlanConfig } from '../models/SubscriptionPlanConfig.model';
import { User } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import type { SubscriptionPlan } from '../types/index';

const getBillingOption = (
  planConfig: ISubscriptionPlanConfig,
  billingDuration?: number,
) => {
  const options = planConfig.billingOptions?.length
    ? planConfig.billingOptions
    : [{
      label: planConfig.duration === 1 ? 'Monthly' : `${planConfig.duration} months`,
      duration: planConfig.duration,
      price: planConfig.price,
    }];

  if (!billingDuration) return options[0];
  return options.find((option) => option.duration === Number(billingDuration)) ?? null;
};

export const getAllSubscriptions = asyncHandler(async (_req: Request, res: Response) => {
  const subs = await Subscription.find()
    .populate('user', 'name email')
    .populate('assignedBy', 'name')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: subs, total: subs.length });
});

export const getMySubscription = asyncHandler(async (req: Request, res: Response) => {
  const userId = new Types.ObjectId(String(req.user._id));
  const sub = await Subscription.findOne({ user: userId, status: 'Active' });
  res.status(200).json({ success: true, data: sub });
});

export const assignSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { userId, plan, endDate, billingDuration } = req.body as {
    userId: string;
    plan: SubscriptionPlan;
    endDate: string;
    billingDuration?: number;
  };

  if (!userId || !plan || !endDate) throw new AppError('userId, plan and endDate are required', 400);

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const planConfig = await SubscriptionPlanConfig.findOne({ plan: String(plan).trim(), isActive: true });
  if (!planConfig) throw new AppError('Subscription plan not available', 404);
  const billingOption = getBillingOption(planConfig, billingDuration);
  if (!billingOption) throw new AppError('Billing option not available for this plan', 404);

  const userObjId = new Types.ObjectId(userId);
  await Subscription.updateMany({ user: userObjId, status: 'Active' }, { status: 'Cancelled' });

  const startDate = new Date();
  const endDateObj = new Date(endDate);

  const sub = await Subscription.create({
    user: userObjId,
    plan: planConfig.plan,
    billingDuration: billingOption.duration,
    billingLabel: billingOption.label,
    pricePaid: billingOption.price,
    startDate,
    endDate: endDateObj,
    assignedBy: new Types.ObjectId(String(req.user._id)),
    status: 'Active',
  });

  user.activeSubscription = {
    plan: planConfig.plan,
    billingDuration: billingOption.duration,
    billingLabel: billingOption.label,
    startDate,
    endDate: endDateObj,
  };
  await user.save();

  res.status(201).json({ success: true, message: 'Subscription assigned', data: sub });
});

export const cancelSubscription = asyncHandler(async (req: Request, res: Response) => {
  const sub = await Subscription.findById(req.params.id);
  if (!sub) throw new AppError('Subscription not found', 404);

  sub.status = 'Cancelled';
  await sub.save();

  await User.findByIdAndUpdate(sub.user, { $unset: { activeSubscription: 1 } });
  res.status(200).json({ success: true, message: 'Subscription cancelled' });
});

export const cancelMySubscription = asyncHandler(async (req: Request, res: Response) => {
  const userId = new Types.ObjectId(String(req.user._id));

  const sub = await Subscription.findOne({ user: userId, status: 'Active' });
  if (!sub) throw new AppError('No active subscription found', 404);

  sub.status = 'Cancelled';
  await sub.save();

  await User.findByIdAndUpdate(userId, { $unset: { activeSubscription: 1 } });
  res.status(200).json({ success: true, message: 'Subscription cancelled' });
});

export const subscribeToPlan = asyncHandler(async (req: Request, res: Response) => {
  const { plan, billingDuration } = req.body as { plan: SubscriptionPlan; billingDuration?: number };
  if (!plan) throw new AppError('plan is required', 400);

  const planConfig = await SubscriptionPlanConfig.findOne({ plan: String(plan).trim(), isActive: true });
  if (!planConfig) throw new AppError('Subscription plan not available', 404);
  const billingOption = getBillingOption(planConfig, billingDuration);
  if (!billingOption) throw new AppError('Billing option not available for this plan', 404);

  const userId = new Types.ObjectId(String(req.user._id));
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  await Subscription.updateMany({ user: userId, status: 'Active' }, { status: 'Cancelled' });

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + billingOption.duration);

  const sub = await Subscription.create({
    user: userId,
    plan: planConfig.plan,
    billingDuration: billingOption.duration,
    billingLabel: billingOption.label,
    pricePaid: billingOption.price,
    startDate,
    endDate,
    assignedBy: userId,
    status: 'Active',
  });

  user.activeSubscription = {
    plan: planConfig.plan,
    billingDuration: billingOption.duration,
    billingLabel: billingOption.label,
    startDate,
    endDate,
  };
  await user.save();

  res.status(201).json({ success: true, message: 'Subscribed successfully', data: sub });
});
