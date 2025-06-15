import { UnauthorizedError } from 'routing-controllers';
import { Inject, Service } from 'typedi';

import { diConstants } from '@withmono/di';
import { MonoLogger } from '@withmono/logger';

import { PasswordAuthService } from './password-auth.service';
import { JwtPayload, LoginResponse } from './types';
import { generateJwtToken, getJwtPayload, validateJwtPayload, validateJwtSignature } from './util';

@Service()
export class AuthService {
  private readonly airtableBaseId: string;

  private readonly airtableUserTable: string;

  constructor(
    @Inject(diConstants.logger) private readonly logger: MonoLogger,
    @Inject() private readonly passwordAuthService: PasswordAuthService,
  ) {
    this.logger.debug('AuthService initialized', {
      airtableBaseId: this.airtableBaseId,
      airtableUserTable: this.airtableUserTable,
    });
  }

  /**
   * Logs in a user using their username and password.
   * If the credentials are valid, it generates a JWT token and returns it.
   *
   * @param username
   * @param password
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    const result = await this.passwordAuthService.authenticate(username, password);
    if (!result.isAuthenticated) {
      this.logger.warn('Login failed: Invalid credentials', { username });
      throw new UnauthorizedError('Invalid username or password');
    }

    // generate jwt
    const payload = getJwtPayload(result);
    const jwt = generateJwtToken(payload);
    return {
      status: 'successful',
      message: 'Login successful',
      data: {
        token: jwt,
        tokenExpiresAt: payload.exp,
        userId: result.userId,
        isAdmin: result.isAdmin,
        isFounder: result.isFounder,
        isInvestor: result.isInvestor,
        isCuriousPerson: result.isCuriousPerson,
      },
    };
  }

  /**
   * Verifies a JWT token and returns the authenticated user data.
   * If the token is invalid, it throws an UnauthorizedError.
   *
   * @param token
   */
  async verifyToken(token: string): Promise<AuthenticatedAuthData> {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64url').toString(),
      ) as JwtPayload;
      if (validateJwtPayload(payload) && validateJwtSignature(token)) {
        this.logger.info('Token verified successfully', { userId: payload.sub });
        return {
          isAuthenticated: true,
          userId: payload.sub,
          isFounder: payload.roles.founder,
          isAdmin: payload.roles.admin,
          isInvestor: payload.roles.investor,
          isCuriousPerson: payload.roles.curious,
        };
      }

      this.logger.warn('Token validation failed');
    } catch (error) {
      this.logger.error('Token verification failed', error);
    }

    throw new UnauthorizedError('Invalid token');
  }
}
