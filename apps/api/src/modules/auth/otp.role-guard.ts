import { AppError } from '../../core/errors/app-error';
import { Role } from './auth.types';

/** Roles that callers are allowed to request at OTP verification time. */
const SELF_ASSIGNABLE_ROLES: Role[] = ['CITIZEN'];

/**
 * Determines the role to persist for a user after OTP verification.
 *
 * - First-time users: accept CITIZEN only; any other requested role is ignored.
 * - Existing users: always keep the stored role; the input is ignored entirely
 *   to prevent escalation through the auth endpoint.
 */
export function resolveOtpRole(params: {
  requestedRole: Role | undefined;
  existingRole: Role | undefined;
  isNewUser: boolean;
}): Role {
  const { requestedRole, existingRole, isNewUser } = params;

  if (!isNewUser) {
    if (!existingRole) {
      throw new AppError('Existing user has no role', 500, 'MISSING_ROLE');
    }
    return existingRole;
  }

  if (requestedRole && !SELF_ASSIGNABLE_ROLES.includes(requestedRole)) {
    throw new AppError(
      `Role '${requestedRole}' cannot be self-assigned at login`,
      403,
      'ROLE_ESCALATION_DENIED',
    );
  }

  return requestedRole ?? 'CITIZEN';
}

/**
 * Determines the district to persist after OTP verification.
 *
 * - New users: accept the supplied district as-is.
 * - Existing users: only update if the existing district is absent.
 *   An explicit district change requires a dedicated profile endpoint.
 */
export function resolveOtpDistrict(params: {
  requestedDistrict: string | undefined;
  existingDistrict: string | undefined;
  isNewUser: boolean;
}): string | undefined {
  const { requestedDistrict, existingDistrict, isNewUser } = params;

  if (isNewUser) return requestedDistrict;
  return existingDistrict ?? requestedDistrict;
}
