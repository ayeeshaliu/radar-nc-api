import { NextFunction, Request, Response } from 'express';

import { diConstants } from '@withmono/di';

import { AuthService } from '../modules/auth/auth.service';

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const { logger } = req;
  const authHeader = req.headers.authorization;

  // Initialize req.auth for every request to ensure it's always defined.
  req.auth = { isAuthenticated: false };

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token) {
      const authService = req.di.get(AuthService);
      try {
        const authData = await authService.verifyToken(token);
        req.auth = authData; // Populate req.auth with authenticated user data
        req.di.set(diConstants.auth, authData);
        logger.info('User authenticated via token', { userId: authData.userId });
      } catch (error) {
        logger.error(
          'Invalid token received, authentication failed.',
          {
            tokenPreview: token.substring(0, 10),
          },
          error,
        );

        // If a token is provided, it MUST be valid.
        // AuthService.verifyToken throws UnauthorizedError for invalid tokens,
        // which will be handled by the AppErrorHandler.
        next(error);
        return;
      }
    } else {
      logger.debug('Bearer token is empty after stripping "Bearer ".');
    }
  } else {
    logger.debug('No Authorization header with Bearer token found.');
  }
  next();
}
