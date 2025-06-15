import { NextFunction, Request, Response } from 'express';

import { diConstants } from '@withmono/di';
import { MonoLogger } from '@withmono/logger';

import { AuthService } from '../modules/auth/auth.service';

import { handleError } from './errors';

/**
 * Extracts the Bearer token from the Authorization header.
 */
function extractBearerToken(authHeader?: string): string | null {
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    return token || null;
  }
  return null;
}

/**
 * Handles authentication errors and logging.
 */
function handleAuthError(logger: MonoLogger, token: string, error: unknown) {
  logger.error(
    'Invalid token received, authentication failed.',
    { tokenPreview: token.substring(0, 10) },
    error,
  );
}

/**
 * Express middleware to authenticate requests using a Bearer token.
 * Sets req.auth and diConstants.auth for downstream use.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { logger } = req;
  const token = extractBearerToken(req.headers.authorization);

  // Always initialize req.auth
  req.auth = { isAuthenticated: false };

  if (token) {
    try {
      const authService = req.di.get(AuthService);
      const authData = await authService.verifyToken(token);
      req.auth = authData;
      logger.info('User authenticated via token', { userId: authData.userId });
    } catch (error) {
      handleAuthError(logger, token, error);
      handleError(req, res, error);
      return;
    }
  } else {
    logger.debug('No valid Bearer token found in Authorization header.');
  }

  req.di.set(diConstants.auth, req.auth);
  next();
}
