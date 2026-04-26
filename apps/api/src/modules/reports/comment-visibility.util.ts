import type { UserRole } from '../users/user.model.js';
import type {
  ReportComment,
  ReportCommentVisibility,
} from './report-comment.model.js';

/** Roles that may read INTERNAL comments. */
const INTERNAL_ALLOWED_ROLES: UserRole[] = ['AGENCY_ADMIN'];

export function canViewVisibility(
  role: UserRole,
  visibility: ReportCommentVisibility,
): boolean {
  if (visibility === 'PUBLIC') return true;
  return INTERNAL_ALLOWED_ROLES.includes(role);
}

/**
 * Filter a list of comments to only those visible to the given role.
 * Citizens never see INTERNAL comments; agency admins see all.
 */
export function filterCommentsByRole<T extends Pick<ReportComment, 'visibility'>>(
  comments: T[],
  role: UserRole,
): T[] {
  return comments.filter((c) => canViewVisibility(role, c.visibility));
}

/**
 * Build a Mongoose query filter for comment visibility.
 * Pass the result directly into a `.find()` call.
 */
export function visibilityQueryFilter(
  role: UserRole,
): { visibility: ReportCommentVisibility } | Record<string, never> {
  if (INTERNAL_ALLOWED_ROLES.includes(role)) return {};
  return { visibility: 'PUBLIC' };
}
