import { SiteSetting } from '../models/SiteSetting.model';
import { money } from './revenue';

const PERCENT = 100;

/** The VAT rate in force now (0 until a Super Admin sets one). */
export const currentVatPercent = async (): Promise<number> => {
  const setting = await SiteSetting.findOne({ key: 'site' }).select('vatPercent').lean();
  return setting?.vatPercent ?? 0;
};

/**
 * VAT is included in what the student paid (the price never changes for them):
 * vat = paid x rate / (100 + rate). 1150 paid at 15% -> 150 VAT.
 */
export const vatIncluded = (paid: number, percent: number): number =>
  percent > 0 && paid > 0 ? money((paid * percent) / (PERCENT + percent)) : 0;
