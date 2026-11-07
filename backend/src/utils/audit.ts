import type { Types } from 'mongoose';
import { AuditLog, type AuditAction, type AuditEntity } from '../models/AuditLog.model';

const HISTORY_LIMIT = 100;
const ACTOR_FIELDS = 'name email role avatar';

interface AuditEntry {
  action: AuditAction;
  entityType: AuditEntity;
  entity?: Types.ObjectId | string;
  actor: Types.ObjectId | string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  note?: string;
}

/** Records one change in the audit log. */
export const recordAudit = async (entry: AuditEntry): Promise<void> => {
  await AuditLog.create(entry);
};

/** The newest history entries of one record (or of every record of a kind when `entity` is left out). */
export const auditHistory = (entityType: AuditEntity, entity?: Types.ObjectId | string, actions?: AuditAction[]) =>
  AuditLog.find({
    entityType,
    ...(entity ? { entity } : {}),
    ...(actions ? { action: { $in: actions } } : {}),
  })
    .sort({ createdAt: -1, _id: -1 })
    .limit(HISTORY_LIMIT)
    .populate('actor', ACTOR_FIELDS)
    .select('-__v')
    .lean();
