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
    isAuthenticated: false;
  }

  interface AuthenticatedAuthData {
    isAuthenticated: true;
    userId: string;
    isFounder: boolean;
    isAdmin: boolean;
    isInvestor: boolean;
    isCuriousPerson: boolean;
  }
}
