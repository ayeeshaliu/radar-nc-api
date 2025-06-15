import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from 'routing-controllers';

import { MonoLogger } from '@withmono/logger';

export type AuthRole = 'admin' | 'founder' | 'investor' | 'curious';

/**
 * Middleware factory to require a specific user role or roles.
 * Usage: app.use(requireAuthType('admin')) or requireAuthType(['admin', 'founder'])
 */
export function requireAuthType(roleType: AuthRole | AuthRole[]) {
  return function authTypeMiddleware(req: Request, _res: Response, next: NextFunction): void {
    if (!req.auth?.isAuthenticated) {
      next(new UnauthorizedError('Authentication required. Please include a valid token.'));
      return;
    }

    const authData = req.auth;
    const requiredRoles = Array.isArray(roleType) ? roleType : [roleType];
    if (userHasRole(authData, requiredRoles, req.logger)) {
      next();
      return;
    }

    next(handleAuthorizationFailure(req, requiredRoles));
  };
}

/**
 * Checks if the authenticated user has at least one of the required roles.
 */
function userHasRole(
  authData: AuthenticatedAuthData,
  requiredRoles: AuthRole[],
  logger?: MonoLogger,
): boolean {
  if (authData.isAdmin) {
    // Admins have access to everything, no need to check further
    return true;
  }

  return requiredRoles.some((role) => {
    switch (role) {
      case 'founder':
        return authData.isFounder;
      case 'investor':
        return authData.isInvestor;
      case 'curious':
        return authData.isCuriousPerson;
      default:
        logger?.warn('Unknown role type specified in requireAuthType', { role });
        return false;
    }
  });
}

/**
 * Handles failed authorization attempts with logging and error response.
 */
function handleAuthorizationFailure(req: Request, requiredRoles: AuthRole[]) {
  const authData = req.auth as AuthenticatedAuthData;
  req.logger?.warn('Authorization failed for user', {
    userId: authData.userId,
    requiredRoles,
    userRoles: authData,
  });
  return new ForbiddenError(
    `Access denied. User does not have the required role(s): ${requiredRoles.join(' or ')}.`,
  );
}
