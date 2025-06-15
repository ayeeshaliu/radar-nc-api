import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from 'routing-controllers';

export type AuthRole = 'admin' | 'founder' | 'investor' | 'curious';

export function requireAuthType(roleType: AuthRole | AuthRole[]) {
  return function authTypeMiddleware(req: Request, _res: Response, next: NextFunction): void {
    if (!req.auth?.isAuthenticated) {
      next(new UnauthorizedError('Authentication required. Please include a valid token.'));
      return;
    }

    const authData = req.auth as AuthenticatedAuthData; // Already checked isAuthenticated
    const rolesToCheck = Array.isArray(roleType) ? roleType : [roleType];

    let authorized = false;
    for (const role of rolesToCheck) {
      switch (role) {
        case 'admin':
          if (authData.isAdmin) authorized = true;
          break;
        case 'founder':
          if (authData.isFounder) authorized = true;
          break;
        case 'investor':
          if (authData.isInvestor) authorized = true;
          break;
        case 'curious': // Any authenticated user is considered 'curious'
          if (authData.isCuriousPerson) authorized = true;
          break;
        default:
          req.logger?.warn('Unknown role type specified in requireAuthType', { role });
          break;
      }
      if (authorized) break;
    }

    if (authorized) {
      next();
    } else {
      req.logger?.warn('Authorization failed for user', {
        userId: authData.userId,
        requiredRoles: rolesToCheck,
        userRoles: authData,
      });

      next(
        new ForbiddenError(
          `Access denied. User does not have the required role(s): ${rolesToCheck.join(' or ')}.`,
        ),
      );
    }
  };
}
