import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Subscription } from '../models/Subscription.model';
import { SubscriptionPlanConfig, type ISubscriptionPlanConfig } from '../models/SubscriptionPlanConfig.model';
import { User } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { escapeRegex } from '../utils/escapeRegex';
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

export const getAllSubscriptions = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = '1',
    limit = '10',
    status,
    plan,
    billingDuration,
    search,
  } = req.query as Record<string, string | undefined>;

  const currentPage = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const skip = (currentPage - 1) * pageSize;
  const now = new Date();

  const baseFilter: Record<string, unknown> = {};
  if (typeof plan === 'string' && plan) baseFilter.plan = plan;
  if (billingDuration) baseFilter.billingDuration = Number(billingDuration);
  if (typeof search === 'string' && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    const matchedUsers = await User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id');
    baseFilter.$or = [
      { plan: regex },
      { user: { $in: matchedUsers.map((user) => user._id) } },
    ];
  }

  const withStatusFilter = (filter: Record<string, unknown>, nextStatus?: string) => {
    if (nextStatus === 'active') {
      return { ...filter, status: 'Active', endDate: { $gt: now } };
    }
    if (nextStatus === 'cancelled') {
      return { ...filter, status: 'Cancelled' };
    }
    if (nextStatus === 'expired') {
      return {
        ...filter,
        $and: [
          ...(Array.isArray(filter.$and) ? filter.$and : []),
          {
            $or: [
              { status: 'Expired' },
              { status: 'Active', endDate: { $lte: now } },
            ],
          },
        ],
      };
    }
    return filter;
  };

  const filter = withStatusFilter(baseFilter, status);

  const [subs, total, activeCount, cancelledCount, expiredCount, allCount] = await Promise.all([
    Subscription.find(filter)
    .populate('user', 'name email')
    .populate('assignedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
    Subscription.countDocuments(filter),
    Subscription.countDocuments(withStatusFilter(baseFilter, 'active')),
    Subscription.countDocuments(withStatusFilter(baseFilter, 'cancelled')),
    Subscription.countDocuments(withStatusFilter(baseFilter, 'expired')),
    Subscription.countDocuments(baseFilter),
  ]);

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  res.status(200).json({
    success: true,
    data: subs,
    total,
    pagination: {
      page: currentPage,
      limit: pageSize,
      total,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
    statusCounts: {
      active: activeCount,
      cancelled: cancelledCount,
      expired: expiredCount,
      all: allCount,
    },
  });
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
  const endDateObj = new Date(endDate);
  if (Number.isNaN(endDateObj.getTime()) || endDateObj <= new Date())
    throw new AppError('endDate must be a valid date in the future', 400);

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const planConfig = await SubscriptionPlanConfig.findOne({ plan: String(plan).trim(), isActive: true });
  if (!planConfig) throw new AppError('Subscription plan not available', 404);
  const billingOption = getBillingOption(planConfig, billingDuration);
  if (!billingOption) throw new AppError('Billing option not available for this plan', 404);

  const userObjId = new Types.ObjectId(userId);
  await Subscription.updateMany({ user: userObjId, status: 'Active' }, { status: 'Cancelled' });

  const startDate = new Date();

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

  const remaining = await Subscription.findOne({ user: sub.user, status: 'Active' }).sort({ endDate: -1 });
  if (remaining) {
    await User.findByIdAndUpdate(sub.user, {
      activeSubscription: {
        plan: remaining.plan,
        billingDuration: remaining.billingDuration,
        billingLabel: remaining.billingLabel,
        startDate: remaining.startDate,
        endDate: remaining.endDate,
      },
    });
  } else {
    await User.findByIdAndUpdate(sub.user, { $unset: { activeSubscription: 1 } });
  }
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
