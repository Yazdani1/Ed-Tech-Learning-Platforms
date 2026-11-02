import { Schema, model, type Document, type Types } from 'mongoose';

/** Public pages a Super Admin can hide (their navbar link disappears and the route answers "not found"). */
export const SITE_PAGE_KEYS = ['courses', 'free-courses', 'pricing', 'teachers', 'practice-quiz', 'community-hub'] as const;
export type SitePageKey = (typeof SITE_PAGE_KEYS)[number];

export interface ICompanyContact {
	phone?: string;
	whatsapp?: string;
	email?: string;
	address?: string;
}

export interface ISiteSetting extends Document {
	/** Always 'site': one settings document for the whole platform */
	key: string;
	hiddenPages: SitePageKey[];
	contact: ICompanyContact;
	updatedBy?: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const siteSettingSchema = new Schema<ISiteSetting>(
	{
		key: { type: String, required: true, unique: true, default: 'site' },
		hiddenPages: [{ type: String, enum: SITE_PAGE_KEYS }],
		contact: {
			phone: { type: String, trim: true },
			whatsapp: { type: String, trim: true },
			email: { type: String, trim: true, lowercase: true },
			address: { type: String, trim: true },
		},
		updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
	},
	{ timestamps: true },
);

export const SiteSetting = model<ISiteSetting>('SiteSetting', siteSettingSchema);
