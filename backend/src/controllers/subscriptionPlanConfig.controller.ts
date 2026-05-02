import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { SubscriptionPlanConfig } from '../models/SubscriptionPlanConfig.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import type { SubscriptionPlan } from '../types/index';

export const getAllPlanConfigs = asyncHandler(async (_req: Request, res: Response) => {
  const configs = await SubscriptionPlanConfig.find({ isActive: true }).sort({ price: 1 });
  res.status(200).json({ success: true, data: configs, total: configs.length });
});

export const upsertPlanConfig = asyncHandler(async (req: Request, res: Response) => {
  const { plan, price, duration, features, badge, color } = req.body as {
    plan: SubscriptionPlan;
    price: number;
    duration: number;
    features: string[];
    badge?: string;
    color?: string;
  };

  if (!plan || price === undefined || !duration) {
    throw new AppError('plan, price, and duration are required', 400);
  }

  const config = await SubscriptionPlanConfig.findOneAndUpdate(
    { plan },
    {
      plan,
      price,
      duration,
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
