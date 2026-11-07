import { Schema, model, type Document, type Types } from 'mongoose';

/**
 * Who changed what and when: VAT rate, user role / block, promo on/off, course unpublish/publish,
 * announcement edit/delete. Entries are never edited or deleted.
 */
export const AUDIT_ACTIONS = [
  'vat.update',
  'user.role',
  'user.block',
  'user.unblock',
  'promo.toggle',
  'course.unpublish',
  'course.publish',
  'announcement.update',
  'announcement.archive',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ENTITIES = ['SiteSetting', 'User', 'Promo', 'Course', 'AnnouncementBroadcast'] as const;
export type AuditEntity = (typeof AUDIT_ENTITIES)[number];

export interface IAuditLog extends Document {
  action: AuditAction;
  entityType: AuditEntity;
  entity?: Types.ObjectId;
  actor: Types.ObjectId;
  /** Snapshot of the changed values before and after (only the fields that changed) */
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  note?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, enum: AUDIT_ACTIONS, required: true },
    entityType: { type: String, enum: AUDIT_ENTITIES, required: true },
    entity: { type: Schema.Types.ObjectId },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// History of one record (newest first) and of one kind of record (the VAT setting)
auditLogSchema.index({ entityType: 1, entity: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, action: 1, createdAt: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
