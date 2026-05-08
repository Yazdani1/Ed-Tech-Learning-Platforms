import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { SubscriptionPlanConfig } from '../models/SubscriptionPlanConfig.model';
import { Course } from '../models/Course.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import type { SubscriptionPlan } from '../types/index';

const normalizeBillingOptions = (
  billingOptions: Array<{ label?: string; duration?: number; price?: number }> | undefined,
  fallbackPrice?: number,
  fallbackDuration?: number,
) => {
  const normalized = (billingOptions ?? [])
    .map((option) => ({
      label: String(option.label ?? '').trim(),
      duration: Number(option.duration),
      price: Number(option.price),
    }))
    .filter((option) => option.label && option.duration > 0 && option.price >= 0);

  if (normalized.length > 0) return normalized;
  if (fallbackPrice !== undefined && fallbackDuration) {
    const duration = Number(fallbackDuration);
    return [{
      label: duration === 1 ? 'Monthly' : `${duration} months`,
      duration,
      price: Number(fallbackPrice),
    }];
  }
  return [];
};

export const getAllPlanConfigs = asyncHandler(async (_req: Request, res: Response) => {
  const [configs, countAgg] = await Promise.all([
    SubscriptionPlanConfig.find({ isActive: true }).sort({ price: 1 }),
    Course.aggregate<{ _id: SubscriptionPlan; count: number }>([
      { $match: { includedInSubscription: true, status: 'Published' } },
      { $unwind: '$allowedSubscriptionPlans' },
      { $group: { _id: '$allowedSubscriptionPlans', count: { $sum: 1 } } },
    ]),
  ]);

  const countMap: Partial<Record<SubscriptionPlan, number>> = {};
  countAgg.forEach(({ _id, count }) => { countMap[_id] = count; });

  const data = configs.map((c) => ({
    ...c.toObject(),
    billingOptions: c.billingOptions?.length
      ? c.billingOptions
      : normalizeBillingOptions(undefined, c.price, c.duration),
    courseCount: countMap[c.plan] ?? 0,
  }));

  res.status(200).json({ success: true, data, total: data.length });
});

export const upsertPlanConfig = asyncHandler(async (req: Request, res: Response) => {
  const { plan, price, duration, billingOptions, features, badge, color } = req.body as {
    plan: SubscriptionPlan;
    price?: number;
    duration?: number;
    billingOptions?: Array<{ label?: string; duration?: number; price?: number }>;
    features: string[];
    badge?: string;
    color?: string;
  };

  const planName = String(plan ?? '').trim();
  const normalizedBillingOptions = normalizeBillingOptions(billingOptions, price, duration);

  if (!planName || normalizedBillingOptions.length === 0) {
    throw new AppError('plan and at least one billing option are required', 400);
  }

  const primaryOption = normalizedBillingOptions[0];
  const config = await SubscriptionPlanConfig.findOneAndUpdate(
    { plan: planName },
    {
      plan: planName,
      price: primaryOption.price,
      duration: primaryOption.duration,
      billingOptions: normalizedBillingOptions,
      features: features ?? [],
      badge,
      color,
      isActive: true,
      createdBy: new Types.ObjectId(String(req.user._id)),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({ success: true, data: config });
});

export const deletePlanConfig = asyncHandler(async (req: Request, res: Response) => {
  const config = await SubscriptionPlanConfig.findByIdAndDelete(req.params.id);
  if (!config) throw new AppError('Plan config not found', 404);
  res.status(200).json({ success: true, message: 'Plan config deleted' });
});
