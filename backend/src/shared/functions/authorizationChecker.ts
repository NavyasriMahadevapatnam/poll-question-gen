import { FirebaseAuthService } from '#root/modules/auth/services/FirebaseAuthService.js';
import { getFromContainer, Action } from 'routing-controllers';
import { logger } from '#root/shared/utils/logger.js';

export async function authorizationChecker(action: Action, roles: string[]): Promise<boolean> {
  const firebaseAuthService = getFromContainer(FirebaseAuthService);
  const token = action.request.headers.authorization?.split(' ')[1];

  if (!token) {
    logger.warn('Authorization failed: No token provided');
    return false; // No token provided
  }
  try {
    const user = await firebaseAuthService.getCurrentUserFromToken(token);

    if (roles.length === 0) return true;

    const authorized = roles.includes(user.role);
    if (!authorized) {
      logger.warn('Authorization failed: Insufficient permissions', {
        userId: user._id.toString(),
        requiredRoles: roles,
        userRole: user.role,
      });
    }
    return authorized;
  } catch (error) {
    logger.error('Authorization error', error instanceof Error ? error : new Error(String(error)));
    return false; // Invalid token or user not found
  }
}
