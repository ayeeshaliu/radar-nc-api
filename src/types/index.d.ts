import type { ContainerInstance } from 'typedi';

import type { MonoLogger } from '@withmono/logger';

declare global {
  namespace Express {
    interface Request {
      logger: MonoLogger;
      auth: AuthData;
      di: ContainerInstance;
    }
  }

  type AuthData = UnauthenticatedAuthData | AuthenticatedAuthData;

  interface UnauthenticatedAuthData {
    authType: 'unauthenticated';
    isAuthenticated: false;
  }

  interface AuthenticatedAuthData {
    authType: 'user' | 'admin';
    isAuthenticated: true;
    userId: string;
  }
}
